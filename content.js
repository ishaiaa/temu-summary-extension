console.log("Temu Expenses Summary extension loaded!!");

var orderData = {
    orders: [],
    fetchFinished: false,
    hasKey: false
}


async function fetchOrders(page, offset_map = null) {
    var key = localStorage.getItem("VerifyAuthToken")

    if(!key) {
        orderData.hasKey = false;
        return
    }

    orderData.hasKey = true

    var headerData = {
        "Access-Control-Allow-Origin": "*",
        "accept": "application/json, text/plain, */*",
        "content-type": "application/json;charset=UTF-8",
        "content-type": "application/json;charset=UTF-8",
        verifyauthtoken: key
    }

    var bodyData = JSON.stringify({
        need_has_next_page:true,
        page: page,
        size:10,
        type:"all",
        offset:null,
        offset_map: offset_map
    })

    fetch("https://www.temu.com/api/bg/aristotle/user_order_list", {
        headers: headerData,
        body: bodyData,
        method: "POST",
        mode: "cors"
    }).then(r=>r.json()).then(data => {
        var orders = data.view_orders.map(order => {
            return {
                currency: order.price_desc.currency,
                cost: order.price_desc.display_amount,
                orderTime: order.parent_order_time
            }
        })

        orders.forEach(order => {
            orderData.orders.push(order)
        })

        if(data.has_next_page) {
            fetchOrders(page + 1, data.offset_map)
        }

        else {
            orderData.fetchFinished = true;
        }
    })
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'Hello from popup') {
        console.log('Received message from popup script:', request.message);
        // Perform some action in response to the message
        sendResponse({ 
            message: 'Hello from content script',
            orderData: orderData
        });
    }
});


fetchOrders(1);

