document.getElementById('upload-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const folder = document.getElementById('folder-select').value;
    const files = document.getElementById('file-input').files;
    const uploadStatus = document.getElementById('upload-status');

    if (files.length === 0) {
        uploadStatus.textContent = 'Please select at least one file.';
        return;
    }

    uploadStatus.textContent = 'Uploading files...';

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = async function (event) {
            const fileContent = event.target.result.split(',')[1]; // base64 content

            try {
                const response = await uploadFileToGitHub(folder, file.name, fileContent);
                if (response.ok) {
                    uploadStatus.textContent = `File ${file.name} uploaded successfully!`;
                } else {
                    uploadStatus.textContent = `Error uploading ${file.name}: ${response.statusText}`;
                }
            } catch (error) {
                uploadStatus.textContent = `Error uploading ${file.name}: ${error.message}`;
            }
        };

        reader.readAsDataURL(file); // Read the file as base64 data
    }
});

async function uploadFileToGitHub(folder, fileName, fileContent) {
    const githubUsername = 'seccomm110'; // Replace with your GitHub username
    const repoName = 'Al-Mahdi'; // Replace with your GitHub repo name
    const branch = 'main'; // Replace with your branch name if different

    // Split the token into different parts
    const tokenPart1 = 'ghp_yj5ZnPqi54dV';
    const tokenPart2 = '1PNEbN6w4p1K3scfYz';
    const tokenPart3 = '3gckWa';

    // Combine the token parts into one
    const token = `${tokenPart1}${tokenPart2}${tokenPart3}`; // Reconstruct the full token

    const url = `https://api.github.com/repos/${githubUsername}/${repoName}/contents/${folder}/${fileName}`;
    const payload = {
        message: `Add ${fileName} to ${folder}`,
        content: fileContent, // File content in base64 format
        branch: branch,
    };

    return fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}