// Function to show the download card with smooth fade-in and pop-in animation
function showDownloadCard() {
    const downloadOverlay = document.getElementById("download-overlay");
    downloadOverlay.classList.add("show");
  }
  
  // Function to hide the download card
  function hideDownloadCard() {
    const downloadOverlay = document.getElementById("download-overlay");
    downloadOverlay.classList.remove("show");
  }
  
  // Function to initiate APK download
  function downloadAPK() {
    // Replace this link with the actual APK file URL
    const apkLink = "https://upnow-prod.ff45e40d1a1c8f7e7de4e976d0c9e555.r2.cloudflarestorage.com/16YklH5rcNRjgp0xYajGp0zbsaK2/600f2cc9-2cb0-4cc1-a408-24aa02548cbb?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=cdd12e35bbd220303957dc5603a4cc8e%2F20241207%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20241207T133940Z&X-Amz-Expires=43200&X-Amz-Signature=11b2a4f9809ae3435557da3bb2502b6a9119f761906e5225ec69619e963c9a38&X-Amz-SignedHeaders=host&response-content-disposition=attachment%3B%20filename%3D%22Dish%20Craft.apk%22";  // Change this to your actual APK URL
   
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = apkLink;
    link.download = 'DishCraft.apk'; // The name the file will have
   
    // Append the link to the body
    document.body.appendChild(link);
   
    // Programmatically click the link to start the download
    link.click();
   
    // Remove the link after the download starts
    document.body.removeChild(link);
  
    // Close the download card after initiating download
    hideDownloadCard();
  }
  
  // Optional: Close download card when clicking outside
  window.addEventListener('click', function(event) {
    const downloadOverlay = document.getElementById("download-overlay");
    const downloadCard = document.getElementById("download-card");
    
    if (event.target === downloadOverlay) {
      hideDownloadCard();
    }
  });