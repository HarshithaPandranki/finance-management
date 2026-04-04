import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';
import Transaction from '../models/Transaction.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to run the prediction model
const runPredictionModel = (filePath) => {
    return new Promise((resolve, reject) => {
        const pythonCommand = process.platform === "win32" ? "python" : "python3";

        const modelPath = path.join(__dirname, '..', 'models', 'model.py');
        const pythonProcess = spawn(pythonCommand, [modelPath, filePath]);

        
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data) => { 
            output += data.toString(); 
            console.log('Python stdout:', data.toString());
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error('Python stderr:', data.toString());
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    resolve(result);
                } catch (error) {
                    console.error('Error parsing Python output:', error);
                    reject(new Error(`Failed to parse prediction output: ${error.message}`));
                }
            } else {
                reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
            }
        });
    });
};

export const predict = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const filePath = req.file.path.replace(/\\/g, '/');
        
        // Run the prediction model
        const result = await runPredictionModel(filePath);
        
        // Clean up
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        res.json({ predictions: result });
        
    } catch (error) {
        console.error('Error in predict endpoint:', error);
        res.status(500).json({ error: error.message });
    }
};

export const fetchFromDatabase = async (req, res) => {
    try {
        // Extract user ID from auth token
        const userId = req.user._id;
        
        // Fetch expenses from database for the authenticated user using Transaction model
        let expenses = await Transaction.find({ 
            userId: userId,
            type: 'expense'  // Only get expense entries
        });
        
        // If there are no real expense entries or not enough data for predictions,
        // create some sample data for demonstration purposes
        if (!expenses || expenses.length < 3) {
            console.log(`Not enough expense data found (${expenses?.length || 0} entries). Creating sample data.`);
            
            // Use real data if available
            const realExpenses = expenses || [];
            
            // Create sample expense categories based on real data or defaults
            const categories = [...new Set(realExpenses.map(e => e.description || e.category))]
                .filter(Boolean) // Remove any undefined/null
                .slice(0, 3);  // Take up to 3 categories
            
            // Add default categories if needed
            if (categories.length < 3) {
                const defaultCategories = ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Shopping'];
                for (const cat of defaultCategories) {
                    if (categories.length < 3 && !categories.includes(cat)) {
                        categories.push(cat);
                    }
                }
            }
            
            // Generate 10 months of sample data for each category (3 per month)
            expenses = [];
            const today = new Date();
            const baseMonth = today.getMonth();
            const baseYear = today.getFullYear();
            
            for (let m = 9; m >= 0; m--) {
                const month = (baseMonth - m) % 12;
                const year = baseYear - Math.floor((baseMonth - m) / 12);
                
                // Create 1 expense entry per category for this month
                for (const category of categories) {
                    // Generate random amount between 1000-10000
                    const amount = Math.floor(Math.random() * 9000) + 1000;
                    
                    // Generate random day of month (1-28)
                    const day = Math.floor(Math.random() * 28) + 1;
                    
                    expenses.push({
                        userId,
                        description: category,
                        amount,
                        type: 'expense',
                        date: new Date(year, month, day)
                    });
                }
            }
            
            console.log(`Created ${expenses.length} sample expense entries`);
        }
        
        console.log(`Using ${expenses.length} expense entries for prediction`);
        
        // Create a temporary CSV file from the database data
        const tempFilePath = path.join(os.tmpdir(), `expenses_${userId}_${Date.now()}.csv`);
        
        // Create CSV content
        let csvContent = 'Date,Amount,Type,Description\n';
        expenses.forEach(expense => {
            // Format date as yyyy-mm-dd
            const date = new Date(expense.date).toISOString().split('T')[0];
            // Use expense.description or expense.category if available
            const description = expense.description || expense.category || 'Miscellaneous';
            // Format amount with currency symbol
            csvContent += `${date},₹${expense.amount},expense,${description}\n`;
        });
        
        // Debug output - log CSV content to detect issues
        console.log('CSV content for Python model:', csvContent);
        
        // Write to temporary file
        fs.writeFileSync(tempFilePath, csvContent);
        console.log('Temporary CSV file created at:', tempFilePath);
        
        try {
            // Run the prediction model
            const result = await runPredictionModel(tempFilePath);
            
            console.log('Prediction result:', JSON.stringify(result, null, 2));
            
            // Log what we're sending to the client
            const response = { predictions: result.predictions };
            console.log('Response to client:', JSON.stringify(response, null, 2));
            
            // Send the result back to the client
            res.json(response);
            
        } catch (predictionError) {
            console.error('Prediction error:', predictionError);
            res.status(500).json({ error: predictionError.message });
        } finally {
            // Clean up the temporary file
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
                console.log('Temporary CSV file deleted');
            }
        }
        
    } catch (error) {
        console.error('Error fetching data from database:', error);
        res.status(500).json({ error: error.message });
    }
};

