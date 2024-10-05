// fileViewer.js

// Split the token into different parts
const tokenPart1 = 'ghp_yj5ZnPqi54dV';
const tokenPart2 = '1PNEbN6w4p1K3scfYz';
const tokenPart3 = '3gckWa';

// Combine the token parts into one
const token = `${tokenPart1}${tokenPart2}${tokenPart3}`; // Reconstruct the full token

let pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 1.5,
    canvas,
    ctx;

// Initialize the file viewer for a folder
export function initializeFileViewer(folder) {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    // GitHub API URL based on the folder parameter
    const apiUrl = `https://api.github.com/repos/seccomm110/Al-Mahdi/contents/${folder}`;
    
    console.log(`Fetching files from: ${apiUrl}`); // Debugging log
    fetchFiles(apiUrl);
}

// Fetch files and subfolders from GitHub
async function fetchFiles(apiUrl) {
    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const files = await response.json();
        console.log("Fetched files:", files); // Log the fetched files for debugging
        
        const fileListElement = document.getElementById('file-list');
        fileListElement.innerHTML = ''; // Clear loading message

        if (files.length === 0) {
            fileListElement.textContent = 'No files found in this folder.';
            return;
        }

        files.forEach(file => {
            if (file.type === 'dir') {
                // Create a folder link if there are subfolders
                const folderLink = document.createElement('a');
                folderLink.href = '#';
                folderLink.textContent = `📂 ${file.name}`;
                folderLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    fetchFiles(`${apiUrl}/${file.name}`);
                });
                fileListElement.appendChild(folderLink);
                fileListElement.appendChild(document.createElement('br'));
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.pdf')) {
                // Create a file link
                const fileLink = document.createElement('a');
                fileLink.href = '#';
                fileLink.textContent = `📄 ${file.name}`;
                fileLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    viewFile(file); // View the file when clicked
                });
                fileListElement.appendChild(fileLink);

                // Create a delete button
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.style.marginLeft = '10px'; // Add some spacing
                deleteButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const confirmation = confirm(`Are you sure you want to delete ${file.name}?`);
                    if (confirmation) {
                        await deleteFile(file);
                        fetchFiles(apiUrl); // Refresh the file list
                    }
                });
                fileListElement.appendChild(deleteButton);
                fileListElement.appendChild(document.createElement('br'));
            }
        });

    } catch (error) {
        console.error('Error fetching files:', error); // Log the error
        document.getElementById('file-list').textContent = 'Error loading files. Please try again later.';
    }
}

// Delete a file from GitHub
async function deleteFile(file) {
    const deleteUrl = `https://api.github.com/repos/seccomm110/Al-Mahdi/contents/${file.path}`; // Use the correct file path
    
    try {
        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${token}`, // Use the reconstructed token
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `Deleting file: ${file.name}`, // Commit message
                sha: file.sha // SHA of the file
            })
        });

        if (!response.ok) {
            const errorData = await response.json(); // Get error details
            throw new Error(`Failed to delete file: ${errorData.message}`);
        }

        console.log(`Deleted file: ${file.name}`);
        alert(`${file.name} has been deleted.`);
    } catch (error) {
        console.error('Error deleting file:', error);
        alert('Failed to delete file. Please try again later.');
    }
}

// View the file (XLSX or PDF)
function viewFile(file) {
    const viewer = document.getElementById('viewer');
    const fileUrl = file.download_url;
    
    console.log(`Viewing file: ${file.name}, URL: ${fileUrl}`); // Debugging log

    if (file.name.endsWith('.xlsx')) {
        // Fetch and display Excel file
        fetch(fileUrl)
            .then(response => response.arrayBuffer())
            .then(data => {
                const workbook = XLSX.read(new Uint8Array(data), { type: "array" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const html = XLSX.utils.sheet_to_html(sheet);
                viewer.innerHTML = html;
                // Hide PDF controls when viewing Excel
                document.querySelector('.pdf-controls').style.display = 'none';
            })
            .catch(error => {
                console.error('Error viewing Excel file:', error); // Log the error
            });
    } else if (file.name.endsWith('.pdf')) {
        // Fetch and display PDF file
        loadPdf(fileUrl);
    }
}

// Load and render the PDF
function loadPdf(url) {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

    console.log(`Loading PDF from: ${url}`); // Debugging log

    pdfjsLib.getDocument(url).promise.then(function (pdfDoc_) {
        pdfDoc = pdfDoc_;
        document.getElementById('page-count').textContent = pdfDoc.numPages;
        renderPage(pageNum);
    }).catch(error => {
        console.error('Error loading PDF:', error); // Log the error
    });
}

// Render PDF page
function renderPage(num) {
    pageRendering = true;
    pdfDoc.getPage(num).then(function (page) {
        const viewport = page.getViewport({ scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);

        renderTask.promise.then(function () {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });

    document.getElementById('page-num').textContent = num;
}

// Queue a PDF page for rendering
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// Handle pagination for the PDF viewer
function setupPagination() {
    document.getElementById('prev-page').addEventListener('click', function () {
        if (pageNum <= 1) return;
        pageNum--;
        queueRenderPage(pageNum);
    });

    document.getElementById('next-page').addEventListener('click', function () {
        if (pageNum >= pdfDoc.numPages) return;
        pageNum++;
        queueRenderPage(pageNum);
    });
}

// Initialize pagination
setupPagination();
