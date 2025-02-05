document.addEventListener("DOMContentLoaded", function () {
    const currencySelect = document.getElementById("currencySelect");
    const loadingMessage = document.getElementById("loadingMessage");

    chrome.storage.sync.get(["selectedCurrency"], function (result) {
        if (result.selectedCurrency) {
            currencySelect.value = result.selectedCurrency;
        }
    });

    currencySelect.addEventListener("change", function () {
        loadingMessage.style.display = "block";  
        
        chrome.storage.sync.set({ selectedCurrency: currencySelect.value }, function () {
            console.log("✅ Para Birimi Güncellendi:", currencySelect.value);

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs.length > 0 && tabs[0].url.includes("store.steampowered.com")) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "reloadPage" }, (response) => {
                        setTimeout(() => {
                            loadingMessage.style.display = "none";
                        }, 1500);

                        if (chrome.runtime.lastError) {
                            console.error("Mesaj gönderilemedi:", chrome.runtime.lastError.message);
                        } else {
                            console.log("📄 Sayfa yenileniyor...");
                        }
                    });
                } else {
                    loadingMessage.style.display = "none";
                    console.warn("The active tab is not Steam, the message is not sent.");
                }
            });
        });
    });
});



async function loadTranslations() {
    try {
      const response = await fetch("https://steam.samettopaloglu.com/language.php");
      if (!response.ok) throw new Error("Dil dosyası yüklenemedi!");
  
      const translations = await response.json();
  
      const userLang = navigator.language || navigator.userLanguage;

      // Supported languages
      const supportedLanguages = ["tr", "fr", "de", "en", "ru", "es", "pt", "zh", "ko", "ja"]; // add
  
      const lang = supportedLanguages.includes(userLang.slice(0, 2))
        ? userLang.slice(0, 2)
        : "en";
  
      //Update translation keys on HTML
      document.querySelectorAll("[data-key]").forEach((element) => {
        const key = element.getAttribute("data-key");
        if (translations[lang] && translations[lang][key]) {
          element.textContent = translations[lang][key];
        } else {
          console.warn(`Çeviri anahtarı bulunamadı: ${key}`);
        }
      });
  
      console.log("✅ Çeviri başarıyla uygulandı.");
    } catch (error) {
      console.error("Dil dosyası yüklenemedi:", error);
    }
  }
  
  // start translate
  document.addEventListener("DOMContentLoaded", loadTranslations);
  




document.getElementById('currencySelect').addEventListener('change', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs[0] || !tabs[0].url.includes("store.steampowered.com")) {
            showError("Error! Active tab is not Steam, selection failed! Switch to the Steam tab, refresh the page and try again.");
        } else {
            console.log("✅ The correct tab is active, proceeding...");
        }
    });
});

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';

    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}
