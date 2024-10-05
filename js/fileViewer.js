// fileViewer.js

let pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 1.5,
    canvas,
    ctx;

// Initialize the file viewer
function initializeFileViewer(folder) {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    // GitHub API URL based on the folder parameter
    const apiUrl = `https://api.github.com/repos/seccomm110/Al-Mahdi/contents/${folder}`;
    
    fetchFiles(apiUrl);
}
async function fetchFiles(apiUrl) {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const files = await response.json();
        console.log(files); // Log the response for debugging
        const fileListElement = document.getElementById('file-list');
        fileListElement.innerHTML = ''; // Clear loading message

        files.forEach(file => {
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.pdf')) {
                const link = document.createElement('a');
                link.href = '#';
                link.textContent = file.name;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    viewFile(file);
                });
                fileListElement.appendChild(link);
            }
        });
    } catch (error) {
        console.error('Error fetching files:', error);
        document.getElementById('file-list').textContent = 'Error loading files. Please try again later.';
    }
}


// Function to view the file
function viewFile(file) {
    const viewer = document.getElementById('viewer');
    const fileUrl = file.download_url;

    if (file.name.endsWith('.xlsx')) {
        // Fetch and display Excel file
        fetch(fileUrl)
            .then(response => response.arrayBuffer())
            .then(data => {
                const workbook = XLSX.read(new Uint8Array(data), { type: "array" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const html = XLSX.utils.sheet_to_html(sheet);
                viewer.innerHTML = html;
                // Clear PDF controls when viewing Excel
                document.querySelector('.pdf-controls').style.display = 'none';
            });
    } else if (file.name.endsWith('.pdf')) {
        // Fetch and display PDF file
        loadPdf(fileUrl);
    }
}

// Load PDF and render it
function loadPdf(url) {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

    // Fetch the PDF file
    pdfjsLib.getDocument(url).promise.then(function (pdfDoc_) {
        pdfDoc = pdfDoc_;
        document.getElementById('page-count').textContent = pdfDoc.numPages;
        // Initial/first page rendering
        renderPage(pageNum);
    });
}

// Render the page
function renderPage(num) {
    pageRendering = true;
    // Using promise to fetch the page
    pdfDoc.getPage(num).then(function (page) {
        const viewport = page.getViewport({ scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);

        // Wait for rendering to finish
        renderTask.promise.then(function () {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });

    // Update page counters
    document.getElementById('page-num').textContent = num;
}

// Queue rendering for next page
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// Set up event listeners for pagination
function setupPagination() {
    document.getElementById('prev-page').addEventListener('click', function () {
        if (pageNum <= 1) {
            return;
        }
        pageNum--;
        queueRenderPage(pageNum);
    });

    document.getElementById('next-page').addEventListener('click', function () {
        if (pageNum >= pdfDoc.numPages) {
            return;
        }
        pageNum++;
        queueRenderPage(pageNum);
    });
}

// Call setupPagination to initialize the event listeners
setupPagination();

// Export the initialize function
export { initializeFileViewer };
