async function loadTranslations() {
  try {
    const response = await fetch(
      "https://steam.samettopaloglu.com/language.php"
    );
    const translations = await response.json();

    const userLang = navigator.language || navigator.userLanguage;

    // Supported languages
    const supportedLanguages = [
      "tr",
      "fr",
      "de",
      "en",
      "ru",
      "es",
      "pt",
      "zh",
      "ko",
      "ja",
    ]; // add

    // Check user's language, if not supported make it "en" as default
    const lang = supportedLanguages.includes(userLang.slice(0, 2))
      ? userLang.slice(0, 2)
      : "en";

    const observer = new MutationObserver(() => {
      const targetElement = document.querySelector(
        ".block.responsive_apppage_details_right.heading"
      );
      if (targetElement) {
        console.log("✅ Blok bulundu, test bloğu ekleniyor.");
        addTestBlockToRightColumn(translations[lang]);
        observer.disconnect();
      }
    });

    // MutationObserver
    const observerr = new MutationObserver(() => {
      const targetElementt = document.querySelector(
        ".home_page_content.special_offers"
      );
      if (targetElementt) {
        addDynamicGameBlocks(translations[lang]);
        addDynamicGameBlockstwo(translations[lang]);
        observerr.disconnect();
      }
    });
    // **start**
    observer.observe(document.body, { childList: true, subtree: true });
    observerr.observe(document.body, { childList: true, subtree: true });
  } catch (error) {
    console.error("Dil dosyası yüklenemedi:", error);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "reloadPage") {
    console.log("📄 Sayfa yeniden yükleniyor...");
    location.reload();
    sendResponse({ status: "success" });
  }
});

async function getExchangeRate(baseCurrency, targetCurrency) {
  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    );
    const data = await response.json();
    return data.rates[targetCurrency];
  } catch (error) {
    console.error("Kur verisi alınamadı:", error);
    return null;
  }
}

const SELECTORS = [
  ".discount_final_price",
  ".discount_original_price",
  ".game_area_dlc_price",
  ".price",
  "#header_wallet_balance",
  ".account_name",
  ".game_area_purchase_game_dropdown_menu_item_text",
  "#search_suggestion_contents .match_subtitle",
  ".sale_price",
  ".normal_price",
  ".market_commodity_orders_header_promote",
  "#orders_histogram .jqplot-xaxis-tick",
  "#pricehistory .jqplot-yaxis-tick",
  ".salepreviewwidgets_StoreSalePriceBox_Wh0L8",
  ".salepreviewwidgets_StoreOriginalPrice_1EKGZ",
  ".game_purchase_price .price",
  ".game_purchase_price .price .es_regional_onmouse .es_regional_icon",
  "#add_to_cart_a39aaa0df44729f8e5be117387b8a175_selected_text",
  "div._3fFFsvII7Y2KXNLDk_krOW",
  "div._3j4dI1yA7cRfCvK8h406OB",
  ".steamdb_prices_top b:last-of-type",
].join(", ");

function detectCurrencyFromPrice(priceText) {
  if (priceText.includes("$")) {
    if (priceText.includes("Mex")) return "MXN"; // Mexican Peso
    if (priceText.includes("Can")) return "CAD"; // Canadian Dollar
    if (priceText.includes("Aus")) return "AUD"; // Australian Dollar
    if (priceText.includes("Arg")) return "ARS"; // Argentine Peso
    if (priceText.includes("Chilean")) return "CLP"; // Chilean Peso
    if (priceText.includes("Brazilian")) return "BRL"; // Brazilian Real
    if (priceText.includes("Colombian")) return "COP"; // Colombian Peso
    if (priceText.includes("New Zealand")) return "NZD"; // New Zealand Dollar
    return "USD"; // US Dollar (default)
  }

  if (priceText.includes("€")) return "EUR"; // Euro
  if (priceText.includes("₺")) return "TRY"; // Turkish Lira
  if (priceText.includes("£")) return "GBP"; // British Pound

  if (priceText.includes("¥")) {
    if (priceText.includes("Japanese")) return "JPY"; // Japanese Yen
    return "CNY"; // Chinese Yuan (default)
  }

  if (priceText.includes("₩")) return "KRW"; // South Korean Won
  if (priceText.includes("₽")) return "RUB"; // Russian Ruble
  if (priceText.includes("₴")) return "UAH"; // Ukrainian Hryvnia
  if (priceText.includes("лв")) return "BGN"; // Bulgarian Lev
  if (priceText.includes("﷼")) return "SAR"; // Saudi Riyal
  if (priceText.includes("د.إ")) return "AED"; // United Arab Emirates Dirham
  if (priceText.includes("₹")) return "INR"; // Indian Rupee
  if (priceText.includes("S$")) return "SGD"; // Singapore Dollar
  if (priceText.includes("R")) {
    if (priceText.includes("South African")) return "ZAR"; // South African Rand
    return "BRL"; // Default
  }
  if (priceText.includes("CHF")) return "CHF"; // Swiss Franc
  if (priceText.includes("zł")) return "PLN"; // Polish Zloty
  if (priceText.includes("Kč")) return "CZK"; // Czech Koruna
  if (priceText.includes("kr")) {
    if (priceText.includes("Danish")) return "DKK"; // Danish Krone
    if (priceText.includes("Norwegian")) return "NOK"; // Norwegian Krone
    if (priceText.includes("Swedish")) return "SEK"; // Swedish Krona
  }
  if (priceText.includes("Ft")) return "HUF"; // Hungarian Forint
  if (priceText.includes("฿")) return "THB"; // Thai Baht
  if (priceText.includes("₫")) return "VND"; // Vietnamese Dong
  if (priceText.includes("Rp")) return "IDR"; // Indonesian Rupiah
  if (priceText.includes("₨")) return "PKR"; // Pakistani Rupee
  if (priceText.includes("E£")) return "EGP"; // Egyptian Pound
  if (priceText.includes("₦")) return "NGN"; // Nigerian Naira
  if (priceText.includes("KSh")) return "KES"; // Kenyan Shilling

  return "USD"; // default
}

async function convertPrices() {
  chrome.storage.sync.get(["selectedCurrency"], async function (result) {
    let selectedCurrency = result.selectedCurrency || "USD"; // default usd
    console.log("🔹 Seçilen Para Birimi:", selectedCurrency);

    const exchangeRate = await getExchangeRate("USD", selectedCurrency);
    if (!exchangeRate) return;

    const processedPrices = new Set();

    function updatePrices() {
      console.log("💰 Fiyatlar Güncelleniyor...");

      document.querySelectorAll(SELECTORS).forEach((priceElement) => {
        if (processedPrices.has(priceElement)) return;
        if (!priceElement.innerText) return;

        const priceText = priceElement.innerText.match(/(\d+(\.\d+)?)/);
        if (priceText) {
          const usdPrice = parseFloat(priceText[0]);
          const convertedPrice = (usdPrice * exchangeRate).toFixed(2);

          if (priceElement.classList.contains("steam-converted")) return;

          // **TRY to TL**
          if (selectedCurrency === "TRY") {
            priceElement.innerText = `${parseFloat(
              convertedPrice
            ).toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} TL`;
          } else {
            priceElement.innerText = `${convertedPrice} ${selectedCurrency}`;
          }

          priceElement.classList.add("steam-converted");
          processedPrices.add(priceElement);
        }
      });
    }

    updatePrices();

    const observer = new MutationObserver(() => {
      clearTimeout(window.priceUpdateTimeout);
      window.priceUpdateTimeout = setTimeout(updatePrices, 500);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const currencySelect = document.getElementById("currencySelect");
    if (currencySelect) {
      currencySelect.addEventListener("change", () => {
        const newCurrency = currencySelect.value;
        chrome.storage.sync.set({ selectedCurrency: newCurrency }, () => {
          console.log("✅ Para Birimi Güncellendi:", newCurrency);
          convertPrices();
        });
      });
    } else {
      console.log(
        "⚠️ 'currencySelect' elementi bulunamadı, ancak hata vermeyecek."
      );
    }

    setTimeout(updatePrices, 3000);
  });
}

convertPrices();

function getAppIdFromUrl() {
  const url = window.location.href;
  const match = url.match(/\/app\/(\d+)\//);
  return match ? match[1] : null;
}

async function fetchGameStats() {
  const appid = getAppIdFromUrl();
  if (!appid) {
    console.error("❌ APP ID bulunamadı.");
    return null;
  }

  try {
    const response = await fetch(
      `https://steam.samettopaloglu.com/steam.php?appid=${appid}`
    );
    if (!response.ok) {
      throw new Error(`HTTP hata! Durum: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("❌ API'den veri alınamadı:", error);
    return null;
  }
}

async function addTestBlockToRightColumn(translation) {
  let testBlock = document.createElement("div");
  testBlock.className = "block responsive_apppage_details_right";
  testBlock.style.padding = "10px";
  testBlock.style.backgroundColor = "#1b2838";
  testBlock.style.color = "#c6d4df";
  testBlock.style.fontFamily = "'Motiva Sans', Arial, sans-serif";
  testBlock.style.fontSize = "14px";
  testBlock.style.marginBottom = "10px";
  testBlock.style.paddingTop = "15px";
  testBlock.style.paddingBottom = "8px";

  let statsContent = `<div style="display: grid; grid-template-columns: 112px auto; row-gap: 4px; column-gap: 10px;">`;

  const gameStats = await fetchGameStats();
  if (!gameStats) {
    console.warn("⚠️ API verisi alınamadı, blok eklenmeyecek.");
    return;
  }

  function formatNumber(value) {
    value = parseFloat(value.toString().replace(/,/g, ""));

    if (value >= 1_000_000_000) {
      return trimTrailingZero(value / 1_000_000_000) + "bn"; // Billion
    } else if (value >= 1_000_000) {
      return trimTrailingZero(value / 1_000_000) + "m"; // Million
    } else if (value >= 1_000) {
      return trimTrailingZero(value / 1_000) + "k"; // Thousand
    }
    return trimTrailingZero(value); // If less than 1k
  }

  function trimTrailingZero(num) {
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(1);
  }

  function formatRevenue(high, low, avg) {
    const formattedHigh = formatNumber(high);
    const formattedLow = formatNumber(low);
    const formattedAvg = formatNumber(avg);
    return `$${formattedAvg} ($${formattedLow} - $${formattedHigh})`;
  }

  function formatsale(high, low, avg) {
    const formattedHigh = formatNumber(high);
    const formattedLow = formatNumber(low);
    const formattedAvg = formatNumber(avg);
    return `${formattedAvg} (${formattedLow} - ${formattedHigh})`;
  }

  function formatReleaseDate(releaseDate) {
    if (!releaseDate || isNaN(new Date(releaseDate).getTime())) {
      return translation.published;
    }

    const release = new Date(releaseDate);
    const now = new Date();

    if (release > now) {
      return translation.published;
    }

    let diffInMs = now - release;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    const years = Math.floor(diffInDays / 365);
    let remainingDays = diffInDays % 365;

    const months = Math.floor(remainingDays / 30);
    remainingDays = remainingDays % 30;

    let result = "";

    if (years > 0) {
      result += `${years} ${translation.year} `;
    }
    if (months > 0) {
      result += `${months} ${translation.month}  `;
    }
    if (remainingDays > 0 || result === "") {
      result += `${remainingDays} ${translation.day}  `;
    }

    return result.trim() + " " + translation.ago;
  }

  const releaseDateFormatted = formatReleaseDate(gameStats.release_date);

  const grossRevenueFormatted = formatRevenue(
    gameStats.gross_revenue_high,
    gameStats.gross_revenue_low,
    gameStats.gross_revenue_avg
  );

  const netRevenueFormatted = formatRevenue(
    gameStats.net_revenue_high,
    gameStats.net_revenue_low,
    gameStats.net_revenue_avg
  );

  const salesFormatted = formatsale(
    gameStats.estimated_sales_high,
    gameStats.estimated_sales_low,
    gameStats.estimated_sales_avg
  );

  const newStats = [
    { name: translation.sales, value: salesFormatted || translation.unknown },
    {
      name: translation.brut,
      value: grossRevenueFormatted || translation.unknown,
    },
    {
      name: translation.net,
      value: netRevenueFormatted || translation.unknown,
    },
    {
      name: translation.comments,
      value: gameStats.comments || translation.unknown,
    },
    { name: translation.date, value: releaseDateFormatted },
    {
      name: translation.active,
      value: gameStats.current_players || translation.unknown,
    },
  ];

  newStats.forEach((stat) => {
    statsContent += `
            <b style="color: rgb(143, 152, 160); font-size: 11.5px; padding-bottom: 2px;">
              ${stat.name}
            </b>
            <span style="color: rgb(39, 174, 96);
    
              font-size: 11.5px; white-space: nowrap;     font-weight: bold;">
              ${stat.value}
            </span>`;
  });

  statsContent += `</div>`;

 
  statsContent += `
          <div style="margin-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 5px;">
            <span id="infoLink" style="
              color: #66c0f4;
            font-size: 0.650rem;
              cursor: pointer;
              text-decoration: none;
            " 
            onmouseover="this.style.color='#8abbd1';" 
            onmouseout="this.style.color='#66c0f4';">
           ${translation.help}    
            </span>
          </div>`;

  createModall();

  function createModall() {
    let modal = document.createElement("div");
    modal.id = "modall";
    modal.style.display = "none";
    modal.style.position = "fixed";
    modal.style.zIndex = "1000";
    modal.style.left = "0";
    modal.style.top = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
    const logoUrl = chrome.runtime.getURL("icons/steampusula.png");

    modal.innerHTML = `
    <div style="
      background: #1b2838;
      padding: 20px;
      max-width: 450px;
      margin: 50px auto;
      border-radius: 8px;
      text-align: left;
      color: #c6d4df;
      font-family: 'Motiva Sans', Arial, sans-serif;
      box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.6);
    ">
      <div style="text-align: center;">
     <img src="${logoUrl}" alt="Logo" style="width: 75px; height: 75px;">
      </div><br>
      <p style="font-size: 14px; line-height: 1.6; color: #acb2b8;">
       ${translation.info}
      </p><br>
      <ul style="font-size: 14px; color: #c6d4df; padding-left: 20px;">
        <li><b>${translation.salesinfo}</b>${translation.salesinfoo}</li><br>
        <li><b>${translation.brutsale}</b>${translation.brutsalewan}</li><br>
        <li><b>${translation.netsale}</b>${translation.brutsaletwu}</li>
      </ul><br>
      <p style="font-size: 14px; color: #acb2b8;">
        ${translation.infoo}
      </p><br>
    </div>`;

    document.body.appendChild(modal);
  }

 
  modall.addEventListener("click", (event) => {
    if (event.target === modall) {
      closeModall(); 
    }
  });

  function openModall() {
    document.getElementById("modall").style.display = "block";
  }

  function closeModall() {
    document.getElementById("modall").style.display = "none";
  }

  testBlock.innerHTML = statsContent;

  setTimeout(() => {
    document.getElementById("infoLink").addEventListener("click", openModall);
  }, 100);

  const targetElement = document.querySelector(".rightcol.game_meta_data");
  if (targetElement) {
    targetElement.insertBefore(testBlock, targetElement.firstChild);
    console.log("✅ Test bloğu başarıyla en üste eklendi!");
  } else {
    console.error("❌ Hedef bölge bulunamadı.");
  }
}

//discounted games home page
async function addDynamicGameBlocks(translation) {
  try {
    showLoadingMessage(translation);
    const response = await fetch(
      "https://steam.samettopaloglu.com/game/convertgame.php"
    );
    if (!response.ok) {
      throw new Error(`HTTP hatası: ${response.status}`);
    }

    let games;
    try {
      games = await response.json();
    } catch (e) {
      hideLoadingMessage();
      showEmptyMessage(translation);
      return;
    }

    if (!Array.isArray(games) || games.length === 0) {
      hideLoadingMessage();
      showEmptyMessage(translation);
      return;
    }

    hideLoadingMessage();
    const style = document.createElement("style");
    style.innerHTML = `
            #game-grid {
              display: grid;
              grid-template-columns: repeat(4, minmax(150px, 1fr));
              gap: 10px;
              justify-content: center;
              max-width: 1000px;
              margin: 0 auto;
              overflow: hidden;
            }
            @media (max-width: 1024px) {
              #game-grid {
                grid-template-columns: repeat(3, minmax(150px, 1fr));
              }
            }
            @media (max-width: 768px) {
              #game-grid {
                grid-template-columns: repeat(1, minmax(100px, 1fr));
              }
            }
            .sorting-select {
              color: #ffffff;
              background-color: #1b2838;
              border: 1px solid #8abbd1;
              padding: 5px;
              font-size: 14px;
              border-radius: 4px;
              margin-right: 10px;
            }
          
            #load-more-button {
  background-color: #1b2838; /* Steam mavisi */
  color: #c7d5e0; /* Yazı rengi olarak açık mavi-gri ton */
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 15px;
  text-align: center;
  transition: background-color 0.3s ease;
}

#load-more-button:hover {
  background-color: #2a475e; /* Daha koyu bir ton hover efekti */
}


            #load-more-button.hidden {
              display: none;
            }
            #loading-message {
              color: #8abbd1;
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              padding: 20px;
            }
          `;
    document.head.appendChild(style);

    const targetElement = document.querySelector(
      ".home_page_content.special_offers"
    );

    if (targetElement) {
      let containerDiv = document.createElement("div");
      containerDiv.style.padding = "15px";
      containerDiv.style.backgroundColor = "#1b2838";
      containerDiv.style.borderRadius = "8px";
      containerDiv.style.marginBottom = "15px";

      let totalGames = games.length;

      containerDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; padding-top: 100px;">
        <h2 style="color: #ffffff; margin-top: 0;">${translation.dailytittle} (${totalGames})</h2>
        <div style="display: flex; gap: 10px; align-items: center;">
          <select id="sorting-select" class="sorting-select">
            <option value="default">${translation.default}</option>
            <option value="asc">${translation.cheapest}</option>
            <option value="desc">${translation.mostExpensive}</option>
            <option value="enyeni">${translation.new}</option>
            <option value="popularity">${translation.mostpopular}</option>
            <option value="positive">${translation.mostpositive}</option>
          </select>
          <span id="toggle-button" style="cursor: pointer; color: #8abbd1; font-size: 14px; font-weight: bold;">${translation.showMore}</span>
    
        <!--
  <span id="infolink" style="cursor: pointer; color: #8abbd1; font-size: 14px; font-weight: bold; display: flex; align-items: center;">
            <span style="display: inline-block; width: 16px; height: 16px; background-color: #8abbd1; color: white; font-size: 10px; font-weight: bold; text-align: center; border-radius: 50%; margin-left: 5px; line-height: 18px;">
              i
            </span>
          </span>
          -->
          
        </div>
      </div>
      <div id="game-grid"></div>
      <button id="load-more-button" class="hidden">${translation.loadMore}</button>
    `;

      targetElement.appendChild(containerDiv);

      const gameGrid = document.getElementById("game-grid");
      const toggleButton = document.getElementById("toggle-button");
      const loadMoreButton = document.getElementById("load-more-button");
      const sortingSelect = document.getElementById("sorting-select");

      let originalGamesList = [...games];
      let loadedGames = 0;
      let currentSortOrder = "default";

      // Sayfa yüklendiğinde ilk 8 oyunu göster
      document.addEventListener("DOMContentLoaded", async () => {
        if (games.length === 0) {
          console.error("Oyun listesi boş!");
          return;
        }
      });

      updateGameGrid(games.slice(0, 8));
      loadedGames = 8;

      async function updateGameGrid(gameList, append = false) {
        if (!append) {
          gameGrid.innerHTML = ""; // Yeni oyunları eklemeden önce temizle
        }

        const imagePromises = gameList.map(async (game) => {
          const isBundle = game.appid.startsWith("bundle_");
          const issub = game.appid.startsWith("sub_");
          let image;
          let link;

          if (isBundle) {
            const appId = game.appid.replace("bundle_", "");
            link = `https://store.steampowered.com/bundle/${appId}`;
            image = await getBundleImage(appId); // Resmi bekle
          } else if (issub) {
            const appId = game.appid.replace("sub_", "");
            link = `https://store.steampowered.com/sub/${appId}`;
            image = `https://cdn.cloudflare.steamstatic.com/steam/subs/${appId}/header_586x192.jpg`;
          } else {
            const appId = game.appid.replace("sub_", "").replace("app_", "");
            link = `https://store.steampowered.com/app/${appId}`;
            image = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
          }

          return {
            id: game.appid,
            title: game.name,
            image: image,
            discount: game.discount_percent,
            originalPrice: game.original_price,
            finalPrice: game.discounted_price,
            link: link,
            reviewCount: game.review_count,
            positivePercent: game.positive_percent,
          };
        });

        const gameCards = await Promise.all(imagePromises);
        gameGrid.innerHTML += gameCards.map(createGameCard).join("");
      }

      toggleButton.addEventListener("click", () => {
        if (toggleButton.textContent === translation.showMore) {
          updateGameGrid(games.slice(0, 20));
          loadedGames = 20;
          toggleButton.textContent = translation.showLess;
          loadMoreButton.classList.remove("hidden");
        } else {
          updateGameGrid(games.slice(0, 8));
          loadedGames = 8;
          toggleButton.textContent = translation.showMore;
          loadMoreButton.classList.add("hidden");
        }

        if (loadedGames >= games.length) {
          loadMoreButton.style.display = "none";
        }
      });

      loadMoreButton.addEventListener("click", async () => {
        const nextGames = games.slice(loadedGames, loadedGames + 20);
        await updateGameGrid(nextGames, true);
        loadedGames += nextGames.length;

        if (loadedGames >= games.length) {
          loadMoreButton.classList.add("hidden");
        }
      });

      sortingSelect.addEventListener("change", () => {
        currentSortOrder = sortingSelect.value;
        sortGamesAndRefresh();
      });

      function sortGamesAndRefresh() {
        let sortedGames = [...originalGamesList];

        if (currentSortOrder === "asc") {
          sortedGames.sort(
            (a, b) =>
              cleanPrice(a.discounted_price) - cleanPrice(b.discounted_price)
          );
        } else if (currentSortOrder === "desc") {
          sortedGames.sort(
            (a, b) =>
              cleanPrice(b.discounted_price) - cleanPrice(a.discounted_price)
          );
        } else if (currentSortOrder === "popularity") {
          sortedGames.sort((a, b) => {
            const reviewCountA =
              a.review_count === "Bilinmiyor" ? 0 : parseInt(a.review_count);
            const reviewCountB =
              b.review_count === "Bilinmiyor" ? 0 : parseInt(b.review_count);

            return reviewCountB - reviewCountA;
          });
        } else if (currentSortOrder === "positive") {
          sortedGames.sort((a, b) => {
            const positivePercentA =
              a.positive_percent === "Bilinmiyor"
                ? -1
                : parseInt(a.positive_percent.replace("%", ""));
            const positivePercentB =
              b.positive_percent === "Bilinmiyor"
                ? -1
                : parseInt(b.positive_percent.replace("%", ""));

            return positivePercentB - positivePercentA;
          });
        } else if (currentSortOrder === "enyeni") {
          sortedGames.reverse();
        }

        games = sortedGames;

        loadedGames = 0;
        gameGrid.innerHTML = "";
        updateGameGrid(games.slice(0, 8));
        toggleButton.style.display = "block";
        loadMoreButton.classList.add("hidden");
      }

      function cleanPrice(price) {
        return parseFloat(price.replace(/[^0-9.,-]+/g, "").replace(",", "."));
      }
    }
  } catch (error) {
    console.error("Veri çekme hatası:", error);
  }

  function createGameCard(game) {
    return `
      <a href="${game.link}" target="_blank" style="text-decoration: none;">
        <div class="game-card" style="
              background-color: #17202a;
              padding: 10px;
              border-radius: 5px;
              transition: transform 0.3s ease;
              height: 180px;
              overflow: hidden;
          " 
          onmouseover="this.style.transform='scale(1.05)'" 
          onmouseout="this.style.transform='scale(1)'"
        >
          <img src="${game.image}" alt="${
      game.title
    }" style="width: 100%; height: 100px; object-fit: cover; border-radius: 5px;">
          <div style="padding-top: 2px; margin-top: 5px; color: #8abbd1; font-size: 14px; font-weight: bold; padding-bottom: 20px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${game.title}
          </div>
          <div style="margin-top: 10px; display: flex; gap: 10px; align-items: center;">
            <div style="background-color: #4c6b22; padding: 3px 5px; color: #c3f89d; font-size: 12px; font-weight: bold; border-radius: 1px;">
              ${game.discount}
            </div>
            <div class="discount_block discount_block_inline" style="display: flex; gap: 5px; align-items: center;">
              ${
                game.originalPrice
                  ? `<div class="discount_original_price" style="color: #7f8c8d; font-size: 11px;">${game.originalPrice}</div>`
                  : ""
              }
              <div class="discount_final_price" style="font-size: 13px;">${
                game.finalPrice
              }</div>
            </div>
          </div>
        </div>
      </a>
    `;
  }
}

// free games home page
async function addDynamicGameBlockstwo(translation) {
  try {
    showLoadingMessage(translation);
    const response = await fetch(
      "https://steam.samettopaloglu.com/free/freegameconverter.php"
    );
    if (!response.ok) {
      throw new Error(`HTTP hatası: ${response.status}`);
    }

    let gamess;
    try {
      gamess = await response.json();
    } catch (e) {
      hideLoadingMessage();
      showEmptyMessage(translation);
      return;
    }

    if (!Array.isArray(gamess) || gamess.length === 0) {
      hideLoadingMessage();
      showEmptyMessage(translation);
      return;
    }

    hideLoadingMessage();

    const style = document.createElement("style");
    style.innerHTML = `
            #game-gridd {
              display: grid;
              grid-template-columns: repeat(4, minmax(150px, 1fr));
              gap: 10px;
              justify-content: center;
              max-width: 1000px;
              margin: 0 auto;
              overflow: hidden;
            }
            @media (max-width: 1024px) {
              #game-gridd {
                grid-template-columns: repeat(3, minmax(150px, 1fr));
              }
            }
            @media (max-width: 768px) {
              #game-gridd {
                grid-template-columns: repeat(1, minmax(100px, 1fr));
              }
            }
            .sorting-selectt {
              color: #ffffff;
              background-color: #1b2838;
              border: 1px solid #8abbd1;
              padding: 5px;
              font-size: 14px;
              border-radius: 4px;
              margin-right: 10px;
            }


            #load-more-buttonn {
  background-color: #1b2838; /* Steam mavisi */
  color: #c7d5e0; /* Yazı rengi olarak açık mavi-gri ton */
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 15px;
  text-align: center;
  transition: background-color 0.3s ease;
}

#load-more-buttonn:hover {
  background-color: #2a475e; /* Daha koyu bir ton hover efekti */
}

           
            #load-more-buttonn.hidden {
              display: none;
            }
            #loading-message {
              color: #8abbd1;
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              padding: 20px;
            }
          `;
    document.head.appendChild(style);

    const targetElement = document.querySelector(
      // ".home_page_content.content_hub_carousel_ctn"
      ".home_page_content.special_offers"
    );

    if (targetElement) {
      let containerDivv = document.createElement("div");

      containerDivv.style.padding = "15px";
      containerDivv.style.backgroundColor = "#1b2838";
      containerDivv.style.borderRadius = "8px";
      containerDivv.style.marginBottom = "15px";

      let totalGamess = gamess.length;

      containerDivv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; padding-top: 100px;">
              <h2 style="color: #ffffff; margin-top: 0;">${translation.freetittle} (${totalGamess})</h2>
              <div style="display: flex; gap: 10px; align-items: center;">
                <select id="sorting-selectt" class="sorting-selectt">
                  <option value="defaultt">${translation.default}</option>
                    <option value="enyenii">${translation.new}</option>
                 <option value="popularityy">${translation.mostpopular}</option>
                   <option value="positivee">${translation.mostpositive}</option>
                </select>
                <span id="toggle-buttonn" style="cursor: pointer; color: #8abbd1; font-size: 14px; font-weight: bold;">${translation.showMore}</span>
              </div>
            </div>
            <div id="game-gridd"></div>
            <button id="load-more-buttonn" class="hidden">${translation.loadMore}</button>
          `;

      targetElement.appendChild(containerDivv);
      //targetElement.parentNode.insertBefore(containerDivv, targetElement);

      const gameGridd = document.getElementById("game-gridd");
      const toggleButtonn = document.getElementById("toggle-buttonn");
      const loadMoreButtonn = document.getElementById("load-more-buttonn");
      const sortingSelectt = document.getElementById("sorting-selectt");

      let originalGamessListt = [...gamess];

      updateGameGridd(gamess.slice(0, 8));

      toggleButtonn.addEventListener("click", () => {
        const allGamess = [...gamess];

        if (toggleButtonn.textContent === translation.showMore) {
          updateGameGridd(allGamess.slice(0, 20));
          loadedGamess = 20;
          toggleButtonn.textContent = translation.showLess;
          loadMoreButtonn.classList.remove("hidden");
        } else {
          updateGameGridd(allGamess.slice(0, 8));
          loadedGamess = 8;
          toggleButtonn.textContent = translation.showMore;
          loadMoreButtonn.classList.add("hidden");
        }
      });

      loadMoreButtonn.addEventListener("click", () => {
        const nextGamess = gamess.slice(loadedGamess, loadedGamess + 20);
        updateGameGridd(nextGamess, true);
        loadedGamess += nextGamess.length;

        if (loadedGamess >= gamess.length) {
          loadMoreButtonn.classList.add("hidden");
        }
      });

      sortingSelectt.addEventListener("change", () => {
        currentSortOrder = sortingSelectt.value;
        sortGamessAndRefreshh();
      });

      function sortGamessAndRefreshh() {
        let sortedGames = [...originalGamessListt];

        if (currentSortOrder === "popularityy") {
          sortedGames.sort((a, b) => {
            const reviewCountA =
              a.review_count === "Bilinmiyor" ? 0 : parseInt(a.review_count);
            const reviewCountB =
              b.review_count === "Bilinmiyor" ? 0 : parseInt(b.review_count);

            return reviewCountB - reviewCountA;
          });
        } else if (currentSortOrder === "enyenii") {
          sortedGames.reverse();
        } else if (currentSortOrder === "positivee") {
          sortedGames.sort((a, b) => {
            const positivePercentA =
              a.positive_percent === "Bilinmiyor"
                ? -1
                : parseInt(a.positive_percent.replace("%", ""));
            const positivePercentB =
              b.positive_percent === "Bilinmiyor"
                ? -1
                : parseInt(b.positive_percent.replace("%", ""));

            return positivePercentB - positivePercentA;
          });
        }

        gamess = sortedGames;

        loadedGames = 0;
        gameGridd.innerHTML = "";
        updateGameGridd(gamess.slice(0, 8));
        toggleButtonn.style.display = "block";
        loadMoreButtonn.classList.add("hidden");
      }

      function updateGameGridd(gameList, append = false) {
        if (!append) {
          gameGridd.innerHTML = "";
        }

        gameList.forEach((game) => {
          const isSub = game.appid.startsWith("sub_");
          const appId = game.appid.replace("sub_", "");

          const link = isSub
            ? `https://store.steampowered.com/sub/${appId}`
            : `https://store.steampowered.com/app/${appId}`;

          let image = isSub
            ? `https://cdn.cloudflare.steamstatic.com/steam/subs/${appId}/header_586x192.jpg`
            : `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;

          gameGridd.innerHTML += createGameCardd({
            id: game.appid,
            title: game.name,
            image: image,
            link: link,
            positive_percent: game.positive_percent,
            review_count: game.review_count,
          });
        });

        const images = document.querySelectorAll(".game-card img");
        const logoUrl = chrome.runtime.getURL("icons/rwr.png");
        images.forEach((img) => {
          img.onerror = function () {
            this.src = logoUrl;
          };
        });
      }
    }
  } catch (error) {
    console.error("Veri çekme hatası:", error);
  }

  function formatReviewCountWithCommas(count) {
    return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function createGameCardd(game) {
    let positivePercent = game.positive_percent;
    let percentColor;
    let reviewText;

    if (positivePercent === "Bilinmiyor") {
      percentColor = "#95a5a6"; // Gri (nötr ton)
      reviewText = translation.unknown;
    } else {
      let percentValue = parseInt(positivePercent.replace("%", "")) || 0;

      if (percentValue >= 90) {
        percentColor = "#27ae60"; // Koyu yeşil
        reviewText = translation.cokpositive;
      } else if (percentValue >= 75) {
        percentColor = "#4caf50"; // Yeşil
        reviewText = translation.positive;
      } else if (percentValue >= 50) {
        percentColor = "#8bc34a"; // Açık yeşil
        reviewText = translation.good;
      } else if (percentValue >= 25) {
        percentColor = "#ff9800"; // Turuncu
        reviewText = translation.mix;
      } else if (percentValue >= 10) {
        percentColor = "#ff5722"; // Koyu turuncu
        reviewText = translation.negative;
      } else {
        percentColor = "#d32f2f"; // Kırmızı
        reviewText = translation.coknegative;
      }
    }
    let reviewDisplay =
      game.review_count !== "Bilinmiyor" && positivePercent !== "Bilinmiyor"
        ? `${formatReviewCountWithCommas(game.review_count)} ${
            translation.inc
          } / ${reviewText} %${positivePercent.replace("%", "")} `
        : translation.unknown;

    return `
        <a href="${game.link}" target="_blank" style="text-decoration: none;">
            <div class="game-card" style="
                  background-color: #17202a;
                  padding: 10px;
                  border-radius: 5px;
                  transition: transform 0.3s ease;
                  height: 202px;
                  overflow: hidden;"
               onmouseover="this.style.transform='scale(1.05)'" 
              onmouseout="this.style.transform='scale(1)'"
            >
                <img src="${game.image}" alt="${game.title}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 5px;">
                
                <div style="padding-top: 2px; margin-top: 5px; color: #8abbd1; font-size: 14px; font-weight: bold; padding-bottom: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${game.title}
                </div>

                <!-- İnceleme bilgileri -->
                <div style="
                    display: flex;
                 
                    margin-top: 5px;
                ">
                    <div style="
                        display: inline-block;
                        color: ${percentColor}; 
                        font-weight: bold; 
                        font-size: 8.5px; 
                        padding: 3px 8px; 
                        border: 1px solid ${percentColor};
                        background-color: rgba(28, 40, 51, 0.9); 
                        text-align: right;
                        border-radius: 3px;
                        box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.4);
                        margin-top:15px;
                    ">

          ${reviewDisplay}
    


                    </div>
                </div>

                <!-- Ücretsiz etiketi -->
                <div style="background-color: #4c6b22; margin-top: 10px; padding: 5px 8px; color: #c3f89d; text-align: center; font-size: 12px; border-radius: 3px;">
                ${translation.free}
                </div>
            </div>
        </a>
    `;
  }
}

async function getBundleImage(appId) {
  const apiUrl = `https://store.steampowered.com/actions/ajaxresolvebundles?bundleids=${appId}&cc=UA&l=english`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    console.log("API yanıtı:", data); // Debugging için

    const bundleData = data[appId] || data[0];
    if (bundleData && bundleData.header_image_url) {
      return bundleData.header_image_url;
    }
  } catch (error) {
    console.error("Bundle resmi alınamadı:", error);
  }

  // If there is an error or no image, return the default image.
  return chrome.runtime.getURL("icons/rwr.png");
}

function showLoadingMessage(translation) {
  const targetElement = document.querySelector(
    ".home_page_content.special_offers"
  );

  if (targetElement) {
    let messageDiv = document.createElement("div");
    messageDiv.id = "loading-message";
    messageDiv.style.padding = "20px";
    messageDiv.style.backgroundColor = "#16232e";
    messageDiv.style.borderRadius = "10px";
    messageDiv.style.marginBottom = "20px";
    messageDiv.style.marginTop = "20px";

    messageDiv.style.display = "flex";
    messageDiv.style.alignItems = "center";
    messageDiv.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.2)";
    messageDiv.style.gap = "10px";

    messageDiv.innerHTML = `
        <div style="display: flex; align-items: center;">
          <img src="https://img.icons8.com/ios-filled/50/8abbd1/loading.png" alt="Loading" style="width: 40px; height: 40px; animation: spin 1s linear infinite;"/>
        </div>
        <div>
          <h3 style="color: #ffffff; margin: 0; font-size: 18px;">${
            translation.loading || "Yükleniyor..."
          }</h3>
          <p style="color: #8abbd1; margin: 5px 0 0; font-size: 14px;">
            ${
              translation.pleaseWait || "Lütfen bekleyin, veriler yükleniyor..."
            }
          </p>
        </div>
      `;

    // Let's add style for animation
    const style = document.createElement("style");
    style.innerHTML = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
    document.head.appendChild(style);

    targetElement.appendChild(messageDiv);
  }
}

function hideLoadingMessage() {
  const loadingDiv = document.getElementById("loading-message");
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

function showEmptyMessage(translation) {
  const targetElement = document.querySelector(
    ".home_page_content.special_offers"
  );
  if (targetElement) {
    let messageDiv = document.createElement("div");
    messageDiv.style.padding = "20px";
    messageDiv.style.backgroundColor = "#16232e";
    messageDiv.style.borderRadius = "10px";
    messageDiv.style.marginBottom = "20px";
    messageDiv.style.marginTop = "20px";

    messageDiv.style.display = "flex";
    messageDiv.style.alignItems = "center";
    messageDiv.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.2)";
    messageDiv.style.gap = "10px";

    messageDiv.innerHTML = `
        <div style="display: flex; align-items: center;">
          <img src="https://img.icons8.com/color/48/error--v1.png" alt="Warning" style="width: 40px; height: 40px;"/>
        </div>
        <div>
          <h3 style="color: #ffffff; margin: 0; font-size: 18px;">${translation.notfound}</h3>
          <p style="color: #8abbd1; margin: 5px 0 0; font-size: 14px;">
          ${translation.after}
          </p>
        </div>
      `;
    targetElement.appendChild(messageDiv);
  }
}

//observerr.observe(document.body, { childList: true, subtree: true });

loadTranslations(); // Apply language texts on page load
