const button1 = document.getElementById("tes-b1");
const button2 = document.getElementById("tes-b2");
const button3 = document.getElementById("tes-b3");
const button4 = document.getElementById("tes-b4");

const buttons = [button1, button2, button3, button4]

const datePickBox = document.getElementById("tes-datepick");
const datePickFrom = document.getElementById("tes-datefrom");
const datePickTo = document.getElementById("tes-dateto");

const varText = document.getElementById("tes-vartext");
const moneySpent = document.getElementById("tes-moneyspent");
const progressInfo = document.getElementById("tes-progressinfo");

const content = document.getElementById("tes-maincontent")

let now = new Date();
let startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
let startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

var orderData = null
var currentTab = 1

const tabPrefs = [
    {
        enableDatePicker: false,
        dateFrom: new Date(startOfMonth),
        dateTo: new Date(),
        varText: "This month"
    },
    {
        enableDatePicker: false,
        dateFrom: new Date(startOfYear),
        dateTo: new Date(),
        varText: "This year"
    },
    {
        enableDatePicker: false,
        dateFrom: new Date(0),
        dateTo: new Date(),
        varText: "In total"
    },
    {
        enableDatePicker: true,
        dateFrom: new Date(),
        dateTo: new Date(),
        varText: "In selected time period"
    }
]


datePickFrom.addEventListener("change", () => {
    getTotalPrices()
})

datePickTo.addEventListener("change", () => {
    getTotalPrices()
})

buttons.forEach(button => {
    button.addEventListener("click", ()=> {
        toggleButton(button)
    })
})

function toggleButton(btn) {
    buttons.forEach(button => {
        button.classList.remove("active")
    })

    btn.classList.add("active")
    var id = +btn.id[btn.id.length-1];
    handleTabChange(id-1)
}

async function handleTabChange(id) {
    if(!await checkCurrentWebsite()) {
        content.innerHTML = `<p>This extension works only on www.temu.com</p>`
        return;
    }

    if(orderData === null) {
        varText.innerText = "Waiting for data"
        return
    }

    if(!orderData.hasKey) {
        varText.innerText = "No auth key found! It seems that you are not logged in"
        return
    }

    varText.innerText = `${tabPrefs[id].varText}, you have spent`
    moneySpent.innerText = "-"
    datePickBox.classList.remove("locked")

    currentTab = id

    if(!tabPrefs[id].enableDatePicker) {
        datePickBox.classList.add("locked")
    }

    datePickFrom.valueAsDate = tabPrefs[id].dateFrom
    datePickTo.valueAsDate = tabPrefs[id].dateTo
    getTotalPrices()

}

async function getTotalPrices() {
    if(!await checkCurrentWebsite()) {
        return;
    }

    var currency = "";
    var moneyValue = 0;
    var skippedOrders = 0
    var ordersCount = 0;

    if(!orderData) return

    orderData.orders.forEach(order => {
        if(currency === "") {
            currency = order.currency
        }
        if(currency !== order.currency) {
            skippedOrders++
            return
        }

        if(order.orderTime < +datePickFrom.valueAsDate/1000) {
            return
        }

        if(order.orderTime > +datePickTo.valueAsDate/1000) {
            return
        }

        ordersCount++
        moneyValue+=+order.cost
    })

    moneySpent.innerHTML = `${Math.round(moneyValue*100)/100} ${currency}`

    console.log(datePickFrom.valueAsDate)
    console.log(datePickTo.valueAsDate)
}

function getActiveTabUrl() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        if (tabs.length > 0) {
          resolve(tabs[0].url);
        } else {
          resolve(null);
        }
      });
    });
  }
  
  async function checkCurrentWebsite() {
    try {
      const activeTabUrl = await getActiveTabUrl();
      return activeTabUrl && activeTabUrl.includes('https://www.temu.com');
    } catch (error) {
      console.error('Error fetching active tab URL:', error);
      return false;
    }
  }

async function fetchOrders() {
    if(!await checkCurrentWebsite()) {
        return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, { 
            message: 'Hello from popup' 
        }, (response) => {
            if(!response || response === null || response === undefined) {
                progressInfo.innerText = "(Order list is still being updated...)"
                setTimeout(fetchOrders, 100)
            }

            orderData = response.orderData

            if(!orderData.fetchFinished) {
                progressInfo.innerText = "(Order list is still being updated...)"
                setTimeout(fetchOrders, 1000)
            }
            else {
                handleTabChange(currentTab-1) 
                progressInfo.innerText = "(Orders list is up to date)"
            }
            getTotalPrices()

        });
      });
}
toggleButton(button1)
fetchOrders();