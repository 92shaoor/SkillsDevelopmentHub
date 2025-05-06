async function loadHeaderFooter() {
    // Load the header
    const header = await fetch('/header.html');
    const headerContent = await header.text();
    document.querySelector('header').innerHTML = headerContent;

    // Load the footer
    const footer = await fetch('/footer.html');
    const footerContent = await footer.text();
    document.querySelector('footer').innerHTML = footerContent;
}

// Call the function to load header and footer
loadHeaderFooter();