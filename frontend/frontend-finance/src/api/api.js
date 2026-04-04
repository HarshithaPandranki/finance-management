// Backend API Configuration
const API_BASE_URL = 'https://finance-management-fnbj.onrender.com';// Deployed backend URL
 // Deployed backend URL

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response Data:", data);  // ✅ Debugging log
        return data;
    } catch (error) {
        console.error("Upload File Error:", error);
        return { error: "Failed to fetch predictions" };
    }
};

export const fetchFromDatabase = async () => {
    try {
        // Get the token from localStorage
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('Authentication token not found');
        }

        const response = await fetch(`${API_BASE_URL}/predict/database`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            // Log full error response for debugging
            const errorText = await response.text();
            console.error('Error response:', errorText);

            // Try to parse as JSON if possible
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: `HTTP error! status: ${response.status}` };
            }

            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Database fetch response:', data); // Add debugging
        return data;
    } catch (error) {
        console.error('Error fetching data from database:', error);
        throw error; // Re-throw the error to be handled in the component
    }
};
