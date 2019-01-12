// Main Parameters
var accountFetchPeriod = 5000;
var priceFetchPeriod = 60000;
var btcDecimals = 5;
var ethDecimals = 5;

// Main Variables and data model
var accounts = [];
var currentAccountUpdated = 0;
var accountsRefresh = false;
var ethPrice = 0;
var btcPrice = 0;
var tokensInfo = new Map();
tokensInfo.set('MANA', {'contract': '0x0f5d2fb29fb7d3cfee444a200298f468908cc942', 'price': 0});
tokensInfo.set('MKR', {'contract': '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', 'price': 0});
tokensInfo.set('POLY', {'contract': '0x9992ec3cf6a55b00978cddf2b27bc6882d88d1ec', 'price': 0});
tokensInfo.set('DAI', {'contract': '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', 'price': 0});

function Account(code, currency, address, label) {
    this.code = code;
    this.currency = currency;
    this.address = address;
    this.label = label;
}


// GUI functions
function showAccountPanel() {
    $('#add-address-btn').hide();
    $('#config-btn').hide();
    $('#new-account-panel').fadeIn();
    $('#acc-address').focus();
}

function showConfigPanel() {
    vex.dialog.alert({
        unsafeMessage: $('#config-container').html(),
    });
}

function createAccountCard(account) {
    if (accounts.length === 0) {
        $('#account-container').empty();
    }

    var accountHTML = '';
    var card_code = 'c2';
    var rest = accounts.length % 8;
    if (rest === 1 || rest === 3 || rest === 4 || rest === 6) {
        card_code = 'c4';
    }
    accountHTML += '<div class="overview-item overview-item--' + card_code + '">';
    accountHTML += '<button type="button" class="remove-account-btn" aria-label="Close" ' +
        'onclick="removeAccount(\'' + account.code + '\');">';
    accountHTML += '<span aria-hidden="true">&times;</span>';
    accountHTML += '</button>';
    accountHTML += '<div class="overview__inner">';
    accountHTML += '<div class="overview-box clearfix">';
    if (account.currency === 'BTC') {
        accountHTML += '<img src="images/btc_outline.png" class="crypto-logo">';
        accountHTML += '<div class="text">';
        accountHTML += '<h2 class="balance tooltipster">-.-----</h2>';
        accountHTML += '<span class="balance-label">Bitcoins | </span>';
        var infoUrl = 'https://www.blockchain.com/btc/address/' + account.address;
    } else if (account.currency === 'MANA') {
        accountHTML += '<img src="images/mana_token_grey.png" class="crypto-logo">';
        accountHTML += '<div class="text">';
        accountHTML += '<h2 class="balance tooltipster">-.-----</h2>';
        accountHTML += '<span class="balance-label">MANA | </span>';
        var infoUrl = 'https://etherscan.io/tokenholdings?a=' + account.address;
    } else if (account.currency === 'MKR') {
        accountHTML += '<img src="images/mkr_token_grey.png" class="crypto-logo">';
        accountHTML += '<div class="text">';
        accountHTML += '<h2 class="balance tooltipster">-.-----</h2>';
        accountHTML += '<span class="balance-label">MKR | </span>';
        var infoUrl = 'https://etherscan.io/tokenholdings?a=' + account.address;
    } else if (account.currency === 'POLY') {
        accountHTML += '<img src="images/poly_token_grey.png" class="crypto-logo">';
        accountHTML += '<div class="text">';
        accountHTML += '<h2 class="balance tooltipster">-.-----</h2>';
        accountHTML += '<span class="balance-label">POLY | </span>';
        var infoUrl = 'https://etherscan.io/tokenholdings?a=' + account.address;
    } else if (account.currency === 'DAI') {
        accountHTML += '<img src="images/dai_token_grey.png" class="crypto-logo">';
        accountHTML += '<div class="text">';
        accountHTML += '<h2 class="balance tooltipster">-.-----</h2>';
        accountHTML += '<span class="balance-label">DAI | </span>';
        var infoUrl = 'https://etherscan.io/tokenholdings?a=' + account.address;
    } else if (account.currency === 'CDP') {
        accountHTML += '<img src="images/cdp_token_grey.png" class="crypto-logo">';
        accountHTML += '<div class="text">';
        accountHTML += '<h2 class="balance tooltipster">-.-----</h2>';
        accountHTML += '<span class="balance-label">DAI | </span>';
        var infoUrl = 'https://mkr.tools/cdp/' + account.address;
    } else {
        // Case: ETH
        accountHTML += '<img src="images/eth_outline.png" class="crypto-logo">';
        accountHTML += '<div class="text">';
        accountHTML += '<h2 class="balance tooltipster">-.-----</h2>';
        accountHTML += '<span class="balance-label">Ethers | </span>';
        var infoUrl = 'https://etherscan.io/address/' + account.address;
    }
    if (account.currency === 'CDP') {
        accountHTML += '<b class="usd-balance">ratio ---.--%</b>';
        accountHTML += '</div>';
        accountHTML += '</div>';
        accountHTML += '<p class="added-address">';
        accountHTML += '<b>' + account.label + '</b> | ';
        var pos = 'CDP #' + account.address;
        accountHTML += '<span class="address-slug">' + pos + '</span>';
    } else {
        accountHTML += '<b class="usd-balance">usd ---.--</b>';
        accountHTML += '</div>';
        var pre = account.address.substr(0, 5);
        var pos = account.address.slice(-5);
        accountHTML += '<p class="added-address">';
        accountHTML += '<b>' + account.label + '</b> | ';
        accountHTML += '<span class="address-slug tooltipster" title="' + account.address + '">' + pre + '...' + pos + '</span>';
    }
    accountHTML += '<a class="more-info-btn" target="_blank" href="' + infoUrl + '"> > </a>';
    accountHTML += '</p>';
    accountHTML += '</div>';
    accountHTML += '</div>';

    var newNode = document.createElement("div");
    newNode.id = account.code;
    newNode.className = 'col-sm-6 col-lg-3 account-card';
    newNode.innerHTML = accountHTML;
    $('#account-container').append(newNode);

    //Init card tooltip
    var selector = $('#' + account.code).find('.added-address');
    initTooltip(selector);
}


// Cookie management functions
function loadSavedAccountsFromCookie() {
    var savedAccounts = Cookies.get("cam-info");
    if (savedAccounts && savedAccounts.length > 2) {
        savedAccounts = $.parseJSON(savedAccounts);
        $('#account-container').empty();
        for (var i = 0; i < savedAccounts.length; i++) {
            addAccount(savedAccounts[i].currency, savedAccounts[i].address, savedAccounts[i].label);
        }
        console.log('Accounts pre loaded: ' + savedAccounts.length);
    } else {
        console.log('No accounts pre loaded');
    }
}

function saveAccountsToCookie() {
    Cookies.set("cam-info", JSON.stringify(accounts), {expires: 365});
}


// Main flow control functions
function startAccountRefresh() {
    accountsRefresh = true;
    refreshAccounts();
}

function refreshAccounts() {
    if (accountsRefresh) {
        setTimeout(updateAccounts, accountFetchPeriod);
    }
}

function updateAccounts() {
    if (accounts.length === 0) {
        console.log('No accounts added yet');
        refreshAccounts();
        return;
    }

    // Reset account counter if reach the last account
    if (currentAccountUpdated === accounts.length) {
        currentAccountUpdated = 0;
    }

    // Send account update request
    try {
        var account = accounts[currentAccountUpdated];
        if (account.currency === 'BTC') {
            requestBtcBalance(account);
        } else if (account.currency === 'ETH') {
            requestEthBalance(account);
        } else if (account.currency === 'CDP') {
            requestCdpBalance(account);
        } else {
            requestEthTokenBalance(account);
        }
    } catch (e) {
        console.log('Some account was removed or some error found. Restarting.');
        currentAccountUpdated = 0;
        refreshAccounts();
    }
}

function createAccount() {
    // Get form data
    var currency = $('#acc-currency').val();
    var address = $('#acc-address').val().trim();
    var label = $('#acc-label').val();

    // Try to add the new account
    var result = addAccount(currency, address, label);

    if (result) {
        $('#acc-address').val('');
        $('#acc-label').val('');
        $('#new-account-panel').hide();
        $('#add-address-btn').fadeIn();
        $('#config-btn').fadeIn();
    } else {
        alert('Verify address format for the currency selected');
        if (address === '') {
            $('#new-account-panel').hide();
            $('#add-address-btn').fadeIn();
            $('#config-btn').fadeIn();
        }
    }
}

function addAccount(currency, address, label) {
    // Validate inputs
    if (['BTC', 'ETH', 'MANA', 'MKR', 'POLY', 'DAI', 'CDP'].indexOf(currency) < 0) {
        console.log('unsupported currency');
        return false;
    }

    var validAddress = false;
    if (currency == 'BTC') {
        var btcAddressFormat = new RegExp("^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$");
        validAddress = btcAddressFormat.test(address);
    } else if (['ETH', 'MANA', 'MKR', 'POLY', 'DAI'].indexOf(currency) >= 0) {
        var ethAddressFormat = new RegExp("^0x[a-fA-F0-9]{40}$");
        validAddress = ethAddressFormat.test(address);
    } else {
        var numberFormat = new RegExp("^[0-9]{1,5}$");
        validAddress = numberFormat.test(address);
    }

    if (!validAddress) {
        console.log('unsupported address for ' + currency);
        return false;
    }

    var accountCode = currency + '-' + (accounts.length + 1);

    if (!label) {
        label = accountCode;
    }

    // Create and render new account
    var newAccount = new Account(accountCode, currency, address, label);
    createAccountCard(newAccount);
    accounts.push(newAccount);
    console.log('new account added');

    saveAccountsToCookie();
    return true;
}

function removeAccount(code) {
    var notCurrentAccount = function (account) {
        return account.code !== code;
    };
    accounts = accounts.filter(notCurrentAccount);
    $('#' + code).fadeOut('normal', function () {
        $('#' + code).remove();
    });
    saveAccountsToCookie();
}


// Fetch data functions
function requestEthBalance(account) {
    if (accounts.length === 0) {
        console.log('No accounts added yet');
        refreshAccounts();
    }

    var etherScanApiKey = "HIVHFXVPC9CPKN1RFZ8PN8HAAMQHNBTCHA";
    var module = 'account';
    var action = 'balance';
    var tag = 'latest';
    var address = account.address;

    var etherScanUrl = "https://api.etherscan.io/api" +
        '?module=' + module + '&action=' + action + '&address=' + address +
        '&tag=' + tag + '&apikey' + etherScanApiKey;

    $.ajax({
        type: "GET",
        url: etherScanUrl,
        data: {},
        crossDomain: true,
        dataType: "json",
        success: function (data, status, jqXHR) {
            console.log('Eth data received: ' + account.code);

            // Populate account with balance received
            var balance = ethFromWei(data['result']);
            var balanceText = balance >= 1000 ? balance.toLocaleString() : balance;
            var accountCard = $('#' + account.code);
            accountCard.find('.balance').text(balanceText);

            // Init or update tooltip
            var title = (new Date).toTimeString();
            if (accountCard.find('.balance').hasClass('tooltipstered')) {
                accountCard.find('.balance').tooltipster('content', title);
            } else {
                accountCard.find('.balance').prop('title', title);
                initTooltip(accountCard.find('.balance').parent());
            }

            // Show price in USD
            if (ethPrice !== 0) {
                var usdBalance = parseFloat((balance * ethPrice).toFixed(2));
                if (usdBalance > 99000000) {
                    usdBalance = Math.round(usdBalance);
                }
                accountCard.find('.usd-balance').text('usd ' + usdBalance.toLocaleString());
            }

            // Send call to update next account
            currentAccountUpdated += 1;
            refreshAccounts();
        },
        error: function (jqXHR, status) {
            // error handler
            console.log('Eth fail: ' + status.code);

            // Send call to update next account
            currentAccountUpdated += 1;
            refreshAccounts();
        }
    });
}

function requestEthTokenBalance(account) {
    if (accounts.length === 0) {
        console.log('No accounts added yet');
        refreshAccounts();
    }

    var etherScanApiKey = "HIVHFXVPC9CPKN1RFZ8PN8HAAMQHNBTCHA";
    var module = 'account';
    var action = 'tokenbalance';
    var contractAddress = tokensInfo.get(account.currency).contract;
    var address = account.address;
    var tag = 'latest';

    var etherScanUrl = "https://api.etherscan.io/api" +
        '?module=' + module + '&action=' + action + '&contractaddress=' + contractAddress + '&address=' + address +
        '&tag=' + tag + '&apikey' + etherScanApiKey;

    $.ajax({
        type: "GET",
        url: etherScanUrl,
        data: {},
        crossDomain: true,
        dataType: "json",
        success: function (data, status, jqXHR) {
            console.log('Token data received: ' + account.code);

            // Populate account with balance received
            var balance = ethFromWei(data['result']);
            var balanceText = balance >= 1000 ? balance.toLocaleString() : balance;
            var accountCard = $('#' + account.code);
            accountCard.find('.balance').text(balanceText);

            // Init or update tooltip
            var title = (new Date).toTimeString();
            if (accountCard.find('.balance').hasClass('tooltipstered')) {
                accountCard.find('.balance').tooltipster('content', title);
            } else {
                accountCard.find('.balance').prop('title', title);
                initTooltip(accountCard.find('.balance').parent());
            }

            // Show balance in USD
            var tokenPrice = tokensInfo.get(account.currency).price;
            if (tokenPrice !== 0) {
                var usdBalance = parseFloat((balance * tokenPrice).toFixed(2));
                if (usdBalance > 99000000) {
                    usdBalance = Math.round(usdBalance);
                }
                accountCard.find('.usd-balance').text('usd ' + usdBalance.toLocaleString());
            } else {
                accountCard.find('.usd-balance').text('Token');
            }

            // Send call to update next account
            currentAccountUpdated += 1;
            refreshAccounts();
        },
        error: function (jqXHR, status) {
            // error handler
            console.log('Token fail: ' + status.code);

            // Send call to update next account
            currentAccountUpdated += 1;
            refreshAccounts();
        }
    });
}

function requestCdpBalance(account) {
    if (accounts.length === 0) {
        console.log('No accounts added yet');
        refreshAccounts();
    }

    var cdpNumber = account.address;
    var query = '{getCup(id: ' + cdpNumber + ') {id, lad, art, ink, pip, ratio}}';

    $.ajax({
        method: "POST",
        url: "https://sai-mainnet.makerfoundation.com/v1",
        contentType: "application/json",
        data: JSON.stringify({query: query, variables: null}),
        crossDomain: true,
        dataType: "json",
        success: function (data, status, jqXHR) {
            console.log('CDP data received: ' + account.code);
            var cdpInfo = data.data.getCup;

            // Populate account with balance received
            var balance = cdpInfo.art;
            var balanceText = balance >= 1000 ? balance.toLocaleString() : balance;
            var accountCard = $('#' + account.code);
            accountCard.find('.balance').text(balanceText);

            // Init or update tooltip
            var title = (new Date).toTimeString();
            if (accountCard.find('.balance').hasClass('tooltipstered')) {
                accountCard.find('.balance').tooltipster('content', title);
            } else {
                accountCard.find('.balance').prop('title', title);
                initTooltip(accountCard.find('.balance').parent());
            }

            // Show balance in USD
            if (cdpInfo.ratio && cdpInfo.ratio !== 0) {
                var ratio = parseFloat(cdpInfo.ratio).toFixed(2);
                accountCard.find('.usd-balance').text('ratio ' + ratio.toLocaleString() + '%');
            } else {
                accountCard.find('.usd-balance').text('ratio');
            }

            // Init tooltip
            var collateral = parseFloat(cdpInfo.ink).toFixed(2);
            if (!accountCard.find('.usd-balance').hasClass('tooltipstered')) {
                accountCard.find('.usd-balance').prop('title', 'Collateral: ' + collateral + ' Eth');
                createTooltip(accountCard.find('.usd-balance'));
            }

            // Init tooltip
            var owner = cdpInfo.lad;
            if (!accountCard.find('.address-slug').hasClass('tooltipstered')) {
                accountCard.find('.address-slug').prop('title', 'Owner: ' + owner);
                createTooltip(accountCard.find('.address-slug'));
            }

            // Send call to update next account
            currentAccountUpdated += 1;
            refreshAccounts();
        },
        error: function (jqXHR, status) {
            // error handler
            console.log('CDP fail: ' + status.code);

            // Send call to update next account
            currentAccountUpdated += 1;
            refreshAccounts();
        }
    });
}

function requestBtcBalance(account) {
    if (accounts.length === 0) {
        console.log('No accounts added yet');
        refreshAccounts();
    }

    var address = account.address;

    var blockexplorerUrl = "https://blockexplorer.com/api/addr/" + address + '/balance';

    $.ajax({
        type: "GET",
        url: blockexplorerUrl,
        data: {},
        crossDomain: true,
        dataType: "json",
        success: function (data, status, jqXHR) {
            console.log('Btc data received: ' + account.code);

            // Populate account with balance received
            var balance = btcFromSatoshi(data.toString());
            var balanceText = balance >= 1000 ? balance.toLocaleString() : balance;
            var accountCard = $('#' + account.code);
            accountCard.find('.balance').text(balanceText);

            // Init or update tooltip
            var title = (new Date).toTimeString();
            if (accountCard.find('.balance').hasClass('tooltipstered')) {
                accountCard.find('.balance').tooltipster('content', title);
            } else {
                accountCard.find('.balance').prop('title', title);
                initTooltip(accountCard.find('.balance').parent());
            }

            // Show balance in USD
            if (btcPrice !== 0) {
                var usdBalance = parseFloat((balance * btcPrice).toFixed(2));
                if (usdBalance > 99000000) {
                    usdBalance = Math.round(usdBalance);
                }
                accountCard.find('.usd-balance').text('usd ' + usdBalance.toLocaleString());
            }

            // Send call to update next account
            currentAccountUpdated += 1;
            refreshAccounts();
        },
        error: function (jqXHR, status) {
            // error handler
            console.log('BTC Update fail: ' + status.code);

            // Send call to update next account
            currentAccountUpdated += 1;
            refreshAccounts();
        }
    });
}

function updateEthBtcPrice() {
    var etherScanApiKey = "HIVHFXVPC9CPKN1RFZ8PN8HAAMQHNBTCHA";
    var module = 'stats';
    var action = 'ethprice';

    var etherScanUrl = "https://api.etherscan.io/api" +
        '?module=' + module + '&action=' + action + '&apikey' + etherScanApiKey;

    $.ajax({
        type: "GET",
        url: etherScanUrl,
        data: {},
        crossDomain: true,
        dataType: "json",
        success: function (data, status, jqXHR) {
            ethPrice = parseFloat(data['result']['ethusd']);
            var ethBtcPrice = parseFloat(data['result']['ethbtc']);
            btcPrice = parseFloat((ethPrice / ethBtcPrice).toFixed(2));
            var prices = 'BTC: usd ' + btcPrice.toLocaleString() + ' | ETH: usd ' + ethPrice.toLocaleString();
            console.log('Price data received - ' + prices);
            $('#right-footer').find('.prices').text(prices);
            $('#left-footer').find('.prices').text('Status: Connected');
            setTimeout(updateEthBtcPrice, priceFetchPeriod);
        },
        error: function (jqXHR, status) {
            // error handler
            console.log('Price data fail: ETH | BTC');

            $('#left-footer').find('.prices').text('Status: Disconnected');
            setTimeout(updateEthBtcPrice, priceFetchPeriod);
        }
    });
}

function updateTokensPrices() {
    var apiKey = "freekey";
    var action = 'getTokenInfo';
    for (var tokenInfo of tokensInfo) {
        var token = tokenInfo[1];
        var url = "https://api.ethplorer.io" + '/' + action + '/' + token.contract + '?apiKey=' + apiKey;
        $.ajax({
            type: "GET",
            url: url,
            crossDomain: true,
            dataType: "json",
            success: function (data, status, jqXHR) {
                var tokenPrice = parseFloat(data['price']['rate']);
                tokensInfo.get(data['symbol']).price = tokenPrice;
                console.log('Price data received - ' + data['symbol'] + ': usd ' + tokenPrice);
            },
            error: function (jqXHR, status) {
                // error handler
                console.log('Price data fail: token');
            }
        });
    }
    setTimeout(updateTokensPrices, priceFetchPeriod);
}

// Color Themes function
function changeTheme(themeCode) {
    if (themeCode === 'blue-sky') {
        $('.page-container').css('background', 'lightsteelblue');
        $('.header-desktop').css('background-image', '-moz-linear-gradient(150deg, lightsteelblue 65%, #6ec34e 5%)')
            .css('background-image', '-webkit-linear-gradient(150deg, lightsteelblue 65%, #6ec34e 5%)')
            .css('background-image', '-ms-linear-gradient(150deg, lightsteelblue 65%, #6ec34e 5%)');
    } else if (themeCode === 'forest') {
        $('.page-container').css('background', 'forestgreen');
        $('.header-desktop').css('background-image', '-moz-linear-gradient(150deg, forestgreen 65%, #6ec34e 5%)')
            .css('background-image', '-webkit-linear-gradient(150deg, forestgreen 65%, #6ec34e 5%)')
            .css('background-image', '-ms-linear-gradient(150deg, forestgreen 65%, #6ec34e 5%)');
    } else {
        // Case Dark Theme
        $('.page-container').css('background', '#1d2123');
        $('.header-desktop').css('background-image', '-moz-linear-gradient(150deg, #1d2123 65%, #6ec34e 5%)')
            .css('background-image', '-webkit-linear-gradient(150deg, #1d2123 65%, #6ec34e 5%)')
            .css('background-image', '-ms-linear-gradient(150deg, #1d2123 65%, #6ec34e 5%)');
    }
}


// Utility functions
function ethFromWei(value) {
    var ethValue = parseInt(value) / 1000000000000000000;
    return parseFloat(ethValue.toFixed(ethDecimals));
}

function btcFromSatoshi(value) {
    var btcValue = parseInt(value) / 100000000;
    return parseFloat(btcValue.toFixed(btcDecimals));
}

function stopAccountRefresh() {
    accountsRefresh = false;
}

function initTooltip(jquery_selector) {
    jquery_selector.find('.tooltipster').tooltipster({
        theme: 'tooltipster-shadow',
        animation: 'fade',
        delay: 300,
        interactive: true
    });
}

function createTooltip(jquery_selector) {
    jquery_selector.tooltipster({
        theme: 'tooltipster-shadow',
        animation: 'fade',
        delay: 300,
        interactive: true
    });
}

console.log('- All controller loaded -');
$(document).ready(function () {
    loadSavedAccountsFromCookie();
    updateEthBtcPrice();
    setTimeout(updateTokensPrices, accountFetchPeriod);
    startAccountRefresh();
});

