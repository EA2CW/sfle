var Bands = {
    b160M: {
        cw: "1.825",
        ssb: "1.890",
        digi: "1.840",
    },
    b80M: {
        cw: "3.532",
        ssb: "3.770",
        digi: "3.573",
    },
    b60M: {
        cw: "5.353",
        ssb: "5.450",
        digi: "5.357",
    },
    b40M: {
        cw: "7.032",
        ssb: "7.100",
        digi: "7.074",
    },
    b30M: {
        cw: "10.110",
        ssb: "10.120",
        digi: "10.136",
    },
    b20M: {
        cw: "14.032",
        ssb: "14.200",
        digi: "14.074",
    },
    b17M: {
        cw: "18.070",
        ssb: "18.120",
        digi: "18.104",
    },
    b15M: {
        cw: "21.032",
        ssb: "21.200",
        digi: "21.074",
    },
    b12M: {
        cw: "24.895",
        ssb: "24.910",
        digi: "24.915",
    },
    b10M: {
        cw: "20.032",
        ssb: "28.200",
        digi: "28.074",
    },
    b6M: {
        cw: "50.090",
        ssb: "50.350",
        digi: "50.313",
    },
    b2M: {
        cw: "144.090",
        ssb: "144.250",
        digi: "144.174",
    },
    b70CM: {
        cw: "432.050",
        ssb: "432.300",
        digi: "432.065",
    },
};

var $textarea = $('.qso-area');
var qsodate = "";
var qsotime = "";
var band = "";
var mode = "";
var freq = "";
var callsign = "";
var errors = [];
var qsoList = [];

function parseDateInput(dateStr) {
    if (!dateStr || dateStr.trim() === '') {
        return null;
    }

    dateStr = dateStr.trim();

    // Try ISO format first (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }

    // Parse DD/MM/YYYY or DD-MM-YYYY
    let match = dateStr.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];

        // Determine if it's DD/MM/YYYY or MM/DD/YYYY based on locale
        const locale = navigator.language || navigator.userLanguage || 'en-US';

        // If UK/EU locale or day is > 12, assume DD/MM/YYYY
        if (locale.startsWith('en-GB') || locale.startsWith('en-AU') ||
            locale.startsWith('en-NZ') || locale.startsWith('en-IE') ||
            parseInt(match[1]) > 12) {
            // DD/MM/YYYY format
            return `${year}-${month}-${day}`;
        } else {
            // MM/DD/YYYY format (US)
            return `${year}-${day}-${month}`;
        }
    }

    // Try to parse as a Date object as fallback
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }

    return null;
}

function handleInput() {
    var qsodate = "";
    var dateInput = $("#qsodate").val();

    // HTML5 date input already returns yyyy-mm-dd format
    if (dateInput) {
        qsodate = dateInput;
    } else {
        qsodate = new Date().toISOString().split("T")[0];
    }

    var operator = $("#operator").val();
    operator = operator.toUpperCase();
    var ownCallsign = $("#my-call").val().toUpperCase();
    ownCallsign = ownCallsign.toUpperCase();

    var extraQsoDate = qsodate;
    var band = "";
    var mode = "";
    var freq = "";
    var callsign = "";
    var sig = "";
    var sigInfo = "";
    var gridLocator = "";
    qsoList = [];
    $("#qsoTable tbody").empty();

    var text = $textarea.val().trim();
    lines = text.split("\n");
    lines.forEach((row) => {
        var rst_s = null;
        var rst_r = null;
        var comment = "";

        // Extract comment from angle brackets
        var commentMatch = row.match(/<([^>]+)>/);
        if (commentMatch) {
            comment = commentMatch[1].trim();
            // Remove the comment from the row for further processing
            row = row.replace(/<[^>]+>/, '').trim();
        }

        items = row.split(" ");
        var itemNumber = 0;
        items.forEach((item) => {
            if (item === '') {
                return;
            }
            if (item.match(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/)) {
                extraQsoDate = item;
            } else if ((item.match(/^[0-2][0-9][0-5][0-9]$/) && itemNumber === 0)) {
                qsotime = item;
            } else if (item.match(/^CW$|^SSB$|^FM$|^AM$|^PSK$|^FT8$/i)) {
                mode = item.toUpperCase();
            } else if (item.match(/^[1-9]?\d\d[Mm]$/) || item.toUpperCase() === '70CM') {
                band = item.toUpperCase();
                freq = 0;
            } else if (item.match(/^\d+\.\d+$/)) {
                freq = item;
                band = '';
            } else if (item.match(/^[1-9]{1}$/) && qsotime && itemNumber === 0) {
                qsotime = qsotime.replace(/.$/, item);
            } else if (item.match(/^[0-5][0-9]{1}$/) && qsotime && itemNumber === 0) {
                qsotime = qsotime.slice(0, -2) + item;
            } else if (isGridLocator(item)) {
                gridLocator = item.substring(1).toUpperCase();
            } else if (isSigInfo(item)) {
                sigInfo = item.toUpperCase();
                sig = getSigFromSigInfo(sigInfo);
            } else if (
                item.match(
                    /([a-zA-Z0-9]{1,3}[0123456789][a-zA-Z0-9]{0,3}[a-zA-Z])|.*\/([a-zA-Z0-9]{1,3}[0123456789][a-zA-Z0-9]{0,3}[a-zA-Z])|([a-zA-Z0-9]{1,3}[0123456789][a-zA-Z0-9]{0,3}[a-zA-Z])\/.*/
                )
            ) {
                callsign = item.toUpperCase();
            } else if ((itemNumber > 0) && (item.match(/(^[1-9][1-9]?[1-9]?$)/i))) {
                if (rst_s === null) {
                    rst_s = item;
                } else {
                    rst_r = item;
                }
            }

            itemNumber = itemNumber + 1;
        });

        errors = [];
        checkMainFieldsErrors();

        if (callsign) {
            if (freq === 0) {
                freq = getFreqFromBand(band, mode);
            } else if (band === '') {
                band = getBandFromFreq(freq);
            }

            if (band === "") {
                addErrorMessage("Band is missing!");
            }
            if (mode === "") {
                addErrorMessage("Mode is missing");
            }
            if (qsotime === "") {
                addErrorMessage("Time is not set!");
            }

            if (isValidDate(extraQsoDate) === false) {
                addErrorMessage("Invalid date " + extraQsoDate);
                extraQsoDate = qsodate;
            }

            console.log(rst_s);
            console.log(rst_r);
            rst_s = getReportByMode(rst_s, mode);
            rst_r = getReportByMode(rst_r, mode);
            console.log(rst_s);
            console.log(rst_r);


            qsoList.push([
                extraQsoDate,
                qsotime,
                callsign,
                freq,
                band,
                mode,
                rst_s,
                rst_r,
                sigInfo,
                gridLocator,
                comment,
            ]);
            // console.log(row);

            // Build callsign cell with optional grid locator underneath
            let callsignCell = `<div class="cell-primary"><a href="https://qrz.com/db/${callsign}" target="_blank" rel="noopener noreferrer">${callsign}</a></div>`;
            if (gridLocator) {
                callsignCell += `<div class="cell-meta">${gridLocator}</div>`;
            }

            // Build sigInfo cell with optional sig underneath
            let sigInfoCell = sigInfo ? `<div class="cell-primary">${sigInfo}</div>` : '';
            if (sig && sigInfo) {
                sigInfoCell += `<div class="cell-meta">${sig}</div>`;
            }

            const tableRow = $(`<tr>
        <td>${extraQsoDate}</td>
        <td>${qsotime}</td>
        <td class="cell-stacked">${callsignCell}</td>
        <td><span data-toggle="tooltip" data-placement="left" title="${freq}">${band}</span></td>
        <td>${mode}</td>
        <td>${rst_s}</td>
        <td>${rst_r}</td>
        <td>${operator}</td>
        <td class="cell-stacked">${sigInfoCell}</td>
        <td class="comment-cell">${comment}</td>
      </tr>`);

            $("#qsoTable > tbody:last-child").append(tableRow);

            localStorage.setItem("tabledata", $("#qsoTable").html());
            localStorage.setItem("my-call", $("#my-call").val());
            localStorage.setItem("operator", $("#operator").val());
            localStorage.setItem("my-sig", $("#my-sig").val());
            localStorage.setItem("my-sig-ref", $("#my-sig-ref").val());
            localStorage.setItem("qso-area", $(".qso-area").val());
            localStorage.setItem("qsodate", $("#qsodate").val());
            localStorage.setItem("my-power", $("#my-power").val());
            localStorage.setItem("my-grid", $("#my-grid").val());

            callsign = "";
            sigInfo = "";
            gridLocator = "";
        }

        showErrors();
    }); //lines.forEach((row)

    // Scroll to the bottom of #qsoTableBody (scroll by the value of its scrollheight property)
    $("#qsoTableBody").scrollTop($('#qsoTableBody').get(0).scrollHeight);

    var qsoCount = qsoList.length;
    if (qsoCount) {
        $(".js-qso-count").html("<strong>Total:</strong> " + qsoCount + " QSO");
    } else {
        $(".js-qso-count").html("");
    }

    if (errors) {
        $(".js-status").html(errors.join("<br>"));
    }
}

function checkMainFieldsErrors() {
    if ($("#my-call").val() === "") {
        addErrorMessage("'My call' field is empty!");
    }

    if ($("#operator").val() === "") {
        addErrorMessage("'Operator' field is empty!");
    }
}

$textarea.keydown(function (event) {
    if (event.which === 13) {
        handleInput();
    }
});

$textarea.focus(function () {
    errors = [];
    checkMainFieldsErrors();
    showErrors();
});

function addErrorMessage(errorMessage) {
    errorMessage = '<span class="text-danger">' + errorMessage + "</span>";
    if (errors.includes(errorMessage) === false) {
        errors.push(errorMessage);
    }
}

function isValidDate(d) {
    return new Date(d) !== "Invalid Date" && !isNaN(new Date(d));
}

$(".js-reload-qso").click(function () {
    handleInput();
});

$(".js-empty-qso").click(function () {
    var result = confirm("Do you really want to reset everything?");
    if (result === true) {
        localStorage.removeItem("tabledata");
        localStorage.removeItem("my-sig");
        localStorage.removeItem("my-sig-ref");
        localStorage.removeItem("qso-area");
        localStorage.removeItem("qsodate");
        localStorage.removeItem("my-grid");
        $("#qsodate").val("");
        $("#qsoTable tbody").empty();
        $("#my-sig-ref").val("");
        $(".qso-area").val("");
        $("#my-grid").val("");
        qsoList = [];
        $(".js-qso-count").html("");
    }
});

function showErrors() {
    if (errors) {
        $(".js-status").html(errors.join("<br>"));
    }
}

$(".js-download-qso").click(function () {
    handleInput();
});

$(".js-load-sample-log").click(function () {
    if ($textarea.val()) {
        if (false === confirm("Do you really want to replace the entered data with the sample log?")) {
            return false;
        }
    }
    const logData = `
80m cw
1212 ok1uu okff-1234
3 ok1rr
4 ok1tn
20 dl6kva 7 8
5 dl5cw 
ssb
32 ok7wa ol/zl-071 5 8
33 ok1xxx  4 3
CW
35 W8FJ 3 4
38 N2KW 449 579
  `;

    $textarea.val(logData.trim());
    const myCall = $("#my-call");
    if (myCall.val() === "") {
        myCall.val("OK2CQR/P");
    }
    const operator = $("#operator");
    if (operator.val() === "") {
        operator.val("OK2CQR");
    }
    const mySig = $("#my-sig");
    if (mySig.val() === "") {
        mySig.val("SOTA");
    }
    const mySigRef = $("#my-sig-ref");
    if (mySigRef.val() === "") {
        mySigRef.val("OKFF-2068");
    }

    handleInput();
});

function getBandFromFreq(freq) {
    if (freq > 1.7 && freq < 2) {
        return "160M";
    } else if (freq > 3.4 && freq < 4) {
        return "80M";
    } else if (freq > 6.9 && freq < 7.3) {
        return "40M";
    } else if (freq > 5 && freq < 6) {
        return "60M";
    } else if (freq > 10 && freq < 11) {
        return "30M";
    } else if (freq > 13 && freq < 15) {
        return "20M";
    } else if (freq > 18 && freq < 19) {
        return "17M";
    } else if (freq > 20 && freq < 22) {
        return "15M";
    } else if (freq > 24 && freq < 25) {
        return "12M";
    } else if (freq > 27 && freq < 30) {
        return "10M";
    } else if (freq > 50 && freq < 55) {
        return "6M";
    } else if (freq > 144 && freq < 149) {
        return "2M";
    } else if (freq > 430 && freq < 460) {
        return "70CM";
    }

    return '';
}

function getFreqFromBand(band, mode) {
    const settingsMode = getSettingsMode(mode.toUpperCase());
    const id = "#" + band.toUpperCase() + settingsMode;
    if ($(id).length) {
        return $(id).val();
    }
}

function getSettingsMode(mode) {
    if (mode === "AM" || mode === "FM" || mode === "SSB") {
        return "SSB";
    }

    if (mode === "CW") {
        return "CW"
    }

    return "DIGI";
}

var htmlSettings = "";
for (const [key, value] of Object.entries(Bands)) {
    htmlSettings = `
    ${htmlSettings}
    <div class="row">
      <div class="col-3 mt-4">
        <strong>${key.slice(1)}</strong>
      </div>
      <div class="col-3">
        <div class="form-group">
          <label for="${key.slice(1)}CW">CW</label>
          <input type="text" class="form-control text-uppercase" id="${key.slice(
        1
    )}CW" value="${value.cw}">
        </div>							
      </div>
      <div class="col-3">
        <div class="form-group">
          <label for="${key.slice(1)}SSB">SSB</label>
          <input type="text" class="form-control text-uppercase" id="${key.slice(
        1
    )}SSB" value="${value.ssb}">
        </div>							
      </div>
      <div class="col-3">
        <div class="form-group">
          <label for="${key.slice(1)}DIGI">DIGI</label>
          <input type="text" class="form-control text-uppercase" id="${key.slice(
        1
    )}DIGI" value="${value.digi}">
        </div>							
      </div>

    </div>
  `;
}
$(".js-band-settings").html(htmlSettings);

$(".js-download-adif").click(function () {
    const operator = $("#operator").val().toUpperCase();
    const ownCallsign = $("#my-call").val().toUpperCase();
    const mySig = $("#my-sig").val().toUpperCase();
    const mySigInfo = $("#my-sig-ref").val().toUpperCase();

    const myPower = $("#my-power").val();
    const myGrid = $("#my-grid").val().toUpperCase();

    const adifHeader = `
ADIF export from Simple fast log entry by Petr, OK2CQR

Internet: https://sfle.ok2cqr.com

<ADIF_VER:5>3.1.6
<PROGRAMID:4>SFLE
<PROGRAMVERSION:5>0.0.2
<EOH>

`;

    if (false === isBandModeEntered()) {
        alert("Some QSO do not have band and/or mode defined!");

        return false;
    }

    var adif = adifHeader;
    qsoList.forEach((item) => {
        const qsodate = item[0].replace("-", "").replace("-", "");
        qso = getAdifTag("QSO_DATE", qsodate);
        qso = qso + getAdifTag("TIME_ON", item[1].replace(":", ""));
        qso = qso + getAdifTag("CALL", item[2]);
        qso = qso + getAdifTag("FREQ", item[3]);
        qso = qso + getAdifTag("BAND", item[4]);
        qso = qso + getAdifTag("MODE", item[5]);

        var rsts = item[6];
        settingsMode = getSettingsMode(rsts);
        if (settingsMode === "SSB") {
            rsts = "59";
        }
        qso = qso + getAdifTag("RST_SENT", rsts);

        var rstr = item[7];
        settingsMode = getSettingsMode(rstr);
        if (settingsMode === "SSB") {
            rstr = "59";
        }
        qso = qso + getAdifTag("RST_RCVD", rstr);

        qso = qso + getAdifTag("OPERATOR", operator);
        qso = qso + getAdifTag("STATION_CALLSIGN", ownCallsign);

        if (mySig === 'SOTA') {
            qso = qso + getAdifTag("MY_SOTA_REF", mySigInfo);
        } else if (mySig === 'POTA') {
            qso = qso + getAdifTag("MY_POTA_REF", mySigInfo);
        } else if (mySig === 'WWFF') {
            qso = qso + getAdifTag("MY_WWFF_REF", mySigInfo);
        } else {
            qso = qso + getAdifTag("MY_SIG", mySig);
            qso = qso + getAdifTag("MY_SIG_INFO", mySigInfo);
        }

        let sigInfo = item[8];
        if (isSotaInfo(sigInfo)) {
            qso = qso + getAdifTag("SOTA_REF", sigInfo);
        } else if (isWwffInfo(sigInfo)) {
            qso = qso + getAdifTag("SIG", "WWFF");
            qso = qso + getAdifTag("SIG_INFO", sigInfo);
        } else if (isPotaInfo(sigInfo)) {
            qso = qso + getAdifTag("SIG", "POTA");
            qso = qso + getAdifTag("SIG_INFO", sigInfo);
        } else if (isWotaInfo(sigInfo)) {
            qso = qso + getAdifTag("SIG", "WOTA");
            qso = qso + getAdifTag("SIG_INFO", sigInfo);
        }

        if (myPower) {
            qso = qso + getAdifTag("TX_PWR", myPower);
        }

        if (myGrid) {
            qso = qso + getAdifTag("MY_GRIDSQUARE", myGrid);
        }

        let gridLocator = item[9];
        if (gridLocator) {
            qso = qso + getAdifTag("GRIDSQUARE", gridLocator);
        }

        let comment = item[10];
        if (comment) {
            qso = qso + getAdifTag("COMMENT", comment);
        }

        qso = qso + "<EOR>";

        adif = adif + qso + "\n";
    });

    qsodate = qsoList[0][0]; // Keep in yyyy-mm-dd format
    const filename =
        qsodate +
        "_" +
        operator.replace("/", "-") +
        "_" +
        mySigInfo.replace("/", "-") +
        ".adi";
    download(filename, adif);
});

$(".js-download-fle").click(function () {
    var operator = $("#operator").val();
    operator = operator.toUpperCase();
    var ownCallsign = $("#my-call").val().toUpperCase();
    var mySig = $("#my-sig").val().toUpperCase();
    var mySigInfo = $("#my-sig-ref").val().toUpperCase();
    var qsodate;

    const dateInput = $("#qsodate").val();
    if (!dateInput) {
        qsodate = new Date().toISOString().split("T")[0];
    } else {
        qsodate = dateInput;
    }

    var textAreaContent = $("textarea[name='qso']").val();

    // Build FLE format content
    var fleContent = "";
    fleContent += "operator " + operator.toLowerCase() + "\n";
    fleContent += "mycall " + ownCallsign.toLowerCase() + "\n";

    if (mySig && mySigInfo) {
        fleContent += "my" + mySig.toLowerCase() + " " + mySigInfo.toLowerCase() + "\n";
    }

    fleContent += "\n# Log\ndate " + qsodate + "\n";

    // Add MY_SIG and MY_SIG_INFO as comments
    if (mySig) {
        fleContent += "# MY_SIG " + mySig + "\n";
    }
    if (mySigInfo) {
        fleContent += "# MY_SIG_INFO " + mySigInfo + "\n";
    }

    fleContent += "\n";
    fleContent += textAreaContent;

    // Create filename with date first (yyyy-mm-dd format)
    const filename = qsodate + "_" + operator.replace("/", "-") + "_" + mySigInfo.replace("/", "-") + ".txt";

    download(filename, fleContent);
});

$(".js-download-csv").click(function () {
    var myCall = $("#my-call").val().toUpperCase();
    var mySigInfo = $("#my-sig-ref").val().toUpperCase();
    var operator = $("#operator").val().toUpperCase();

    var dateInput = $("#qsodate").val();
    const qsodate = dateInput ? dateInput : new Date().toISOString().split("T")[0];

    // Helper function to escape CSV fields
    function escapeCsvField(field) {
        if (field == null || field === '') {
            return '';
        }
        // Convert to string
        field = String(field);
        // If field contains comma, quote, or newline, wrap in quotes and escape quotes
        if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
            return '"' + field.replace(/"/g, '""') + '"';
        }
        return field;
    }

    // Helper function to convert band to MHz
    function bandToMhz(band) {
        const bandMap = {
            '160M': '1.8',
            '80M': '3.5',
            '60M': '5',
            '40M': '7',
            '30M': '10',
            '20M': '14',
            '17M': '18',
            '15M': '21',
            '12M': '24',
            '10M': '28',
            '6M': '50',
            '2M': '144',
            '70CM': '432'
        };
        return bandMap[band.toUpperCase()] || band;
    }

    // Helper function to format date as dd/mm/yy
    function formatDateDDMMYY(dateStr) {
        // dateStr is in yyyy-mm-dd format
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year = parts[0].substring(2); // Get last 2 digits of year
            const month = parts[1];
            const day = parts[2];
            return day + '/' + month + '/' + year;
        }
        return dateStr;
    }

    // Build CSV content
    var csvContent = "";

    // Process each QSO
    qsoList.forEach((item) => {
        const date = formatDateDDMMYY(item[0]);
        const time = item[1].replace(':', ''); // Remove colon from time (hhmm format)
        const callsign = item[2];
        const freq = item[3];
        const band = item[4];
        const mode = item[5];
        const sigInfo = item[8] || '';
        const comment = item[10] || '';

        // Convert band to MHz if we have a band
        const bandMhz = band ? bandToMhz(band) : freq;

        // Build CSV line with proper escaping
        const csvLine = [
            'V2',
            escapeCsvField(myCall),
            escapeCsvField(mySigInfo),
            escapeCsvField(date),
            escapeCsvField(time),
            escapeCsvField(bandMhz),
            escapeCsvField(mode),
            escapeCsvField(callsign),
            escapeCsvField(sigInfo),
            escapeCsvField(comment)
        ].join(',');

        csvContent += csvLine + '\n';
    });

    // Create filename with date first (yyyy-mm-dd format)
    const filename = qsodate + "_" + operator.replace("/", "-") + "_" + mySigInfo.replace("/", "-") + ".csv";

    download(filename, csvContent);
});

$(".js-import-fle").click(function () {
    // Check if there's existing data in the textarea
    var currentData = $("textarea[name='qso']").val().trim();

    if (currentData) {
        // Ask user for confirmation to overwrite
        if (!confirm("You have existing QSO data. Do you want to overwrite it with the imported file?")) {
            return; // User cancelled, don't proceed
        }
    }

    // Trigger the hidden file input
    $("#fle-file-input").click();
});

// Handle file selection
$("#fle-file-input").change(function (event) {
    const file = event.target.files[0];

    if (!file) {
        return; // No file selected
    }

    // Check if it's a text file
    if (!file.name.endsWith('.txt')) {
        alert("Please select a valid FLE file (.txt)");
        // Reset the file input
        event.target.value = '';
        return;
    }

    // Read the file
    const reader = new FileReader();

    reader.onload = function (e) {
        const content = e.target.result;

        // Parse the FLE file
        parseFLEFile(content);

        // Reset the file input so the same file can be selected again
        event.target.value = '';
    };

    reader.onerror = function () {
        alert("Error reading file. Please try again.");
        event.target.value = '';
    };

    reader.readAsText(file);
});

function parseFLEFile(content) {
    // Parse FLE file format
    const lines = content.split('\n');
    let operator = '';
    let myCall = '';
    let mySig = '';
    let mySigRef = '';
    let qsoDate = '';
    let qsoData = [];
    let inLogSection = false;

    lines.forEach(line => {
        line = line.trim();

        // Skip empty lines
        if (line === '') {
            return;
        }

        // Parse header fields
        if (line.startsWith('operator ')) {
            operator = line.substring(9).trim().toUpperCase();
        } else if (line.startsWith('mycall ')) {
            myCall = line.substring(7).trim().toUpperCase();
        } else if (line.startsWith('mysota ')) {
            mySig = 'SOTA';
            mySigRef = line.substring(7).trim().toUpperCase();
        } else if (line.startsWith('mypota ')) {
            mySig = 'POTA';
            mySigRef = line.substring(7).trim().toUpperCase();
        } else if (line.startsWith('mywwff ')) {
            mySig = 'WWFF';
            mySigRef = line.substring(7).trim().toUpperCase();
        } else if (line.startsWith('mywota ')) {
            mySig = 'WOTA';
            mySigRef = line.substring(7).trim().toUpperCase();
        } else if (line.startsWith('date ')) {
            qsoDate = line.substring(5).trim();
            inLogSection = true;
        } else if (line.startsWith('# MY_SIG ')) {
            mySig = line.substring(9).trim().toUpperCase();
        } else if (line.startsWith('# MY_SIG_INFO ')) {
            mySigRef = line.substring(14).trim().toUpperCase();
        } else if (inLogSection) {
            // This is QSO data - add it to the array (skip comments)
            if (line && !line.startsWith('#')) {
                qsoData.push(line);
            }
        }
    });

    // Update form fields
    if (operator) {
        $("#operator").val(operator);
    }
    if (myCall) {
        $("#my-call").val(myCall);
    }
    if (mySig) {
        $("#my-sig").val(mySig);
    }
    if (mySigRef) {
        $("#my-sig-ref").val(mySigRef);
    }
    if (qsoDate) {
        $("#qsodate").val(qsoDate);
    }

    // Update textarea with QSO data
    if (qsoData.length > 0) {
        $("textarea[name='qso']").val(qsoData.join('\n'));
    }

    // Trigger handleInput to reload the QSO list
    handleInput();
}

function isBandModeEntered() {
    let isBandModeOK = true;
    qsoList.forEach((item) => {
        if ((item[4] === '') || (item[5] === '')) {
            isBandModeOK = false;
        }
    });

    return isBandModeOK;
}

function getAdifTag(tagName, value) {
    return "<" + tagName + ":" + value.length + ">" + value + " ";
}

function getReportByMode(rst, mode) {
    settingsMode = getSettingsMode(mode);

    if (rst === null) {
        if (settingsMode === "SSB") {
            return "59";
        }

        return "599";
    }

    if (settingsMode === "SSB") {
        if (rst.length === 1) {
            return '5' + rst;
        }

        return rst;
    }

    if (rst.length === 1) {
        return '5' + rst + '9';
    } else if (rst.length === 2) {
        return rst + '9';
    }

    return rst;
}

function isSotaInfo(value) {
    return (value.match(/^[A-Z]*[A-Z][0-9]*\/[A-Z]{2}-\d{3}$/i));
}

function isWwffInfo(value) {
    return (value.match(/^[A-Z]*[F]{2}-\d{4}$/i));
}

function isPotaInfo(str) {
    // Return false for empty or null/undefined strings
    if (!str || typeof str !== 'string') {
        return false;
    }

    // POTA reference pattern (case-insensitive)
    const potaPattern = /^[A-Z0-9]{1,4}-\d{4,5}(?:@[A-Z0-9-]{4,6})?$/i;

    // Remove all whitespace, split by comma, and check each item
    const items = str.replace(/\s+/g, '').split(',');

    // Check if at least one item exists and all items match the pattern
    return items.length > 0 && items.every(item => potaPattern.test(item));
}

function getSigFromSigInfo(sigInfo) {
    if (isPotaInfo(sigInfo)) {
        return "POTA";
    } else if (isWwffInfo(sigInfo)) {
        return "WWFF";
    } else if (isWotaInfo(sigInfo)) {
        return "WOTA";
    } else if (isSotaInfo(sigInfo)) {
        return "SOTA"
    } else return "";
}

function isWotaInfo(str) {
    // Return false for empty or null/undefined strings
    if (!str || typeof str !== 'string') {
        return false;
    }

    // WOTA reference pattern: LDW-nnn or LDO-nnn (case-insensitive)
    const wotaPattern = /^[A-Z]{2}[WO]-\d{3}$/i;


    // Remove all whitespace and check if it matches the pattern
    return wotaPattern.test(str.replace(/\s+/g, ''));
}

function isSigInfo(str) {
    return isSotaInfo(str) || isPotaInfo(str) || isWotaInfo(str) || isWwffInfo(str);
}

// Validate Maidenhead locator format (#IO84NJ)
// Supports 2, 4, 6, or 8 character locators (up to 4 pairs)
function isGridLocator(str) {
    if (!str || typeof str !== 'string') {
        return false;
    }

    // Must start with #
    if (!str.startsWith('#')) {
        return false;
    }

    // Remove the # prefix for validation
    const locator = str.substring(1);

    // Must be 2, 4, 6, or 8 characters (1-4 pairs)
    if (locator.length < 2 || locator.length > 8 || locator.length % 2 !== 0) {
        return false;
    }

    // Validate the pattern: pairs of letters, then numbers, then letters, then numbers
    // First pair: 2 letters (field)
    if (!/^[A-Ra-r]{2}/.test(locator)) {
        return false;
    }

    // Second pair (if present): 2 digits (square)
    if (locator.length >= 4 && !/^[A-Ra-r]{2}[0-9]{2}/.test(locator)) {
        return false;
    }

    // Third pair (if present): 2 letters (subsquare)
    if (locator.length >= 6 && !/^[A-Ra-r]{2}[0-9]{2}[A-Xa-x]{2}/.test(locator)) {
        return false;
    }

    // Fourth pair (if present): 2 digits (extended square)
    return !(locator.length >= 8 && !/^[A-Ra-r]{2}[0-9]{2}[A-Xa-x]{2}[0-9]{2}/.test(locator));
}

function download(filename, text) {
    var element = document.createElement("a");
    element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function loadPowerSettings() {
    myPower = localStorage.getItem('my-power');

    let element = document.getElementsByClassName('js-power');
    if (myPower) {
        element[0].innerHTML = 'Power: ' + myPower + 'W &nbsp;&nbsp;&nbsp;&nbsp;';
    } else {
        element[0].innerHTML = '';
    }

    document.getElementById('my-power').value = myPower;
}

function loadMyGridSettings() {
    myGrid = localStorage.getItem('my-grid');

    let element = document.getElementsByClassName('js-my-grid');
    if (myGrid) {
        element[0].innerHTML = 'My grid: ' + myGrid.toUpperCase();
    } else {
        element[0].innerHTML = '';
    }

    document.getElementById('my-grid').value = myGrid;
}

document.getElementById('my-power').onchange = function () {
    localStorage.setItem('my-power', this.value);
    loadPowerSettings();
};

document.getElementById('my-grid').onchange = function () {
    localStorage.setItem('my-grid', this.value);
    loadMyGridSettings();
};


$(document).ready(function () {
    var tabledata = localStorage.getItem("tabledata");
    var mycall = localStorage.getItem("my-call");
    var operator = localStorage.getItem("operator");
    var mysotawwff = localStorage.getItem("my-sig-ref");
    var qsoarea = localStorage.getItem("qso-area");
    var qsodate = localStorage.getItem("qsodate");
    var myPower = localStorage.getItem("my-power");
    var myGrid = localStorage.getItem("my-grid");

    if (mycall != null) {
        $("#my-call").val(mycall);
    }

    if (operator != null) {
        $("#operator").val(operator);
    }

    if (mysotawwff != null) {
        $("#my-sig-ref").val(mysotawwff);
    }

    if (qsoarea != null) {
        $(".qso-area").val(qsoarea);
    }

    if (qsodate != null) {
        $("#qsodate").val(qsodate);
    } else {
        // Set today's date as default in yyyy-mm-dd format (ISO format for HTML5 date input)
        var today = new Date();
        var dateStr = today.toISOString().split('T')[0];
        $("#qsodate").val(dateStr);
    }

    if (myPower != null) {
        $("#my-power").val(myPower);
    }

    if (myGrid != null) {
        $("#my-grid").val(myGrid);
    }

    if (tabledata != null) {
        $("#qsoTable").html(tabledata);
        handleInput();
    }

    loadPowerSettings();
    loadMyGridSettings();

    // Initial sync of table height
    syncTableHeight();

    // Observe textarea for size changes
    const textarea = document.querySelector('.qso-area');
    if (textarea) {
        resizeObserver.observe(textarea);

        // Also add a periodic check to catch manual resizing
        setInterval(function() {
            const currentHeight = textarea.offsetHeight;
            if (currentHeight !== textarea._lastHeight) {
                textarea._lastHeight = currentHeight;
                debouncedSyncTableHeight();
            }
        }, 200);

        // Initialize the last height
        textarea._lastHeight = textarea.offsetHeight;
    }
});

// Sync table height to match textarea + buttons
let lastKnownHeight = 0;

function syncTableHeight() {
    const textarea = $('.qso-area');

    if (textarea.length === 0) {
        return;
    }

    const textareaOffset = textarea.offset();
    if (!textareaOffset) {
        return;
    }

    // Find the button container
    const buttonContainer = textarea.closest('.row').next('.row');

    if (buttonContainer.length === 0) {
        return;
    }

    const buttonOffset = buttonContainer.offset();
    if (!buttonOffset) {
        return;
    }

    // Calculate total height: from top of textarea to bottom of buttons
    const textareaTop = textareaOffset.top;
    const buttonBottom = buttonOffset.top + buttonContainer.outerHeight();
    const totalHeight = buttonBottom - textareaTop;

    const qsoList = $('.qsoList');
    const qsoListOffset = qsoList.offset();

    if (!qsoListOffset) {
        return;
    }

    // Make the table the same total height as textarea + buttons
    const qsoListHeight = totalHeight;

    // Only update if height has actually changed
    if (Math.abs(qsoListHeight - lastKnownHeight) < 5) {
        return;
    }

    lastKnownHeight = qsoListHeight;

    const headerHeight = $('#qsoTable thead').outerHeight() || 40;
    const bodyHeight = qsoListHeight - headerHeight;

    qsoList.height(qsoListHeight);
    $('#qsoTableBody').css('max-height', bodyHeight + 'px');
}

// Debounce function to prevent rapid updates
let resizeTimeout;
function debouncedSyncTableHeight() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(syncTableHeight, 50);
}

// Watch for textarea resize only (not the entire column)
const resizeObserver = new ResizeObserver(function(entries) {
    debouncedSyncTableHeight();
});
