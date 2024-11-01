// Load Navbar Function
function loadNavbar() {
  const xhr = new XMLHttpRequest();

  // Check if the current page is in a subdirectory
  const pathPrefix = window.location.pathname.includes('/pages/') ? '../' : '';
  xhr.open('GET', `${pathPrefix}navbar.html`, true);

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      document.getElementById('navbar-placeholder').innerHTML = xhr.responseText;
    }
  };

  xhr.send();
}

// Call loadNavbar when DOM is ready
document.addEventListener("DOMContentLoaded", loadNavbar);

// Toggle Sidebar Function
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  sidebar.classList.toggle('open');
  mainContent.classList.toggle('shifted');
}

// Automatically Close Sidebar on Outside Click
document.addEventListener("click", function(event) {
  const sidebar = document.getElementById('sidebar');
  const toggleButton = document.querySelector('.sidebar-toggle');
  
  // Check if the sidebar is open and the clicked element is outside the sidebar and toggle button
  if (sidebar.classList.contains('open') && 
      !sidebar.contains(event.target) && 
      !toggleButton.contains(event.target)) {
    sidebar.classList.remove('open');
    mainContent.classList.remove('shifted');
  }
});

// Go Back Function
function goBack() {
  window.history.back();
}
