const regionMap = {
    "Aether": "NA",
    "Crystal": "NA",
    "Primal": "NA",
    "Chaos": "EU",
    "Light": "EU",
    "Elemental": "JP",
    "Gaia": "JP",
    "Mana": "JP",
};

this.loadPage();

function loadPage() {
    if ($.cookie('bearer_token') != null && $.cookie('cwls_id')) {
        document.getElementById("bearer_token").value = $.cookie('bearer_token');
        document.getElementById("cwls_id").value = $.cookie('cwls_id');

        generatePage(document.getElementById("bearer_token").value, document.getElementById("cwls_id").value);
    }
}

function generatePage(bearerToken, cwlsId) {
    cwlsUrl = "https://xivapi.com/linkshell/crossworld/" + cwlsId;

    $.getJSON(cwlsUrl, (data) => {
        var result = "";
        var container = document.getElementById("container");

        var linkshell = data.Linkshell;

        result += "<div class=\"linkshell_pane d-flex align-items-end\">";
        result += "<div class=\"h1\" id=\"linkshell_name\">" + linkshell.Profile.Name + "</div>";
        result += "<div class=\"h3 text-muted ml-3\" id=\"linkshell_dc\">" + linkshell.Profile.Server + "</div>";
        result += "</div>";

        result += "<div id=\"members_pane\">";
        var i = 0
        for (i; i < linkshell.Results.length; i++) {
            var member = linkshell.Results[i];

            result += "<div class=\"card mb-2\">";
            result += "<div class=\"media\">";
            result += "<a class=\"text-dark\" href=\"" + "https://jp.finalfantasyxiv.com/lodestone/character/" + member.ID + "\" target=\"_blank\" rel=\"noopener noreferrer\">";
            result += "<img class=\"avatar d-flex m-2 shadow\" src=\"" + member.Avatar + "\">";
            result += "</a>";

            result += "<div class=\"media-body\">";
            result += "<div class=\"character_pane d-flex align-items-end\">";
            result += "<div class=\"member_name h2\">" + member.Name + "</div>";
            result += "<div class=\"server_name text-muted h4 ml-3\">" + member.Server + "</div>";
            result += "<div id=\"send_page_icon_" + generateReplaceName(member.Name) + "_" + generateServerName(member.Server) + "\" class=\"send_page_icon_pane d-flex\">";
            result += "<a class=\"text-dark\" href=\"" + "https://jp.finalfantasyxiv.com/lodestone/character/" + member.ID + "\" target=\"_blank\" rel=\"noopener noreferrer\">";
            result += "<img class=\"m-2\" style=\"width:32px\" src=\"resource/web_icon/lodestone.png\">";
            result += "</a>";
            result += "</div>";
            result += "</div>";
            result += "<div id=\"logs_perf_" + generateReplaceName(member.Name) + "_" + generateServerName(member.Server) + "\"></div>";

            result += "</div>";
            result += "</div>";
            result += "</div>";
        }
        result += "</div>";
        container.innerHTML = result;

        createlogsData(data, bearerToken);
    });
}

function createlogsData(cwlsData, bearerToken) {
    var clientUrl = 'https://www.fflogs.com/api/v2/client';

    fetch(clientUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                Authorization: 'Bearer ' + bearerToken
            },
            body: JSON.stringify({
                query: generateGetCharacterDataQuery(cwlsData)
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error == null) {
                var q = generateGetCharacterDataQuery(cwlsData);
                Object.keys(data.data.characterData).forEach(function(key) {
                    var char = data.data.characterData[key];
                    if (char != null) {
                        generateSendLogsIcon(char, "send_page_icon_" + generateReplaceName(char.name) + "_" + char.server.name);
                        generatePerfProgressBar(char, "logs_perf_" + generateReplaceName(char.name) + "_" + char.server.name);
                    } else {
                        var progressBarContainer = document.getElementById("logs_perf_" + key);
                        progressBarContainer.innerHTML = "<div class=\"none_content text-muted h3 text-center font-italic\">It is a character that is not registered in FF logs.</div>"
                    }
                });
            } else {
                alert(data.error);
                console.log(data.error);
            }
        })
        .catch(function(error) {
            alert(error);
            console.log(error);
        });
}

function generateReplaceName(Name) {
    return Name.replace(' ', '_').replace(new RegExp('\''), '_').replace(new RegExp('-'), '_');
}

function generateServerName(Server) {
    return Server.split("(")[0].trim();
}

function generateServerRegion(Server) {
    var server = Server.trim().split("(")[1].split(")")[0];
    return regionMap[server];
}

function generatePerfProgressBar(char, progressBarId) {
    var progressBarContainer = document.getElementById(progressBarId);
    var progressBars = "";
    var totalPerf = 0;

    var rankings = char.zoneRankings.rankings;

    var i = 0;
    for (i; i < rankings.length; i++) {
        var perf = rankings[i].rankPercent != null ? Math.floor(rankings[i].rankPercent) : 0;
        totalPerf += perf;

        progressBars += "<div class=\"perf_content row d-flex align-items-center\">";

        progressBars += "<a class=\"text-dark center-block col-2\" href=\"" + "https://ja.fflogs.com/character/id/" + char.canonicalID + "#boss=" + rankings[i].encounter.id + "\" target=\"_blank\" rel=\"noopener noreferrer\">";
        progressBars += rankings[i].encounter.name
        progressBars += "</a>"

        progressBars += "<div class=\"job_icon_pane col-1\">";
        if (rankings[i].bestSpec != null) {
            progressBars += "<img class=\"job_icon\" style=\"width:24px\" src=\"resource/job_icon/" + rankings[i].bestSpec + ".png\">";
        }
        progressBars += "</div>";

        progressBars += "<div class=\"progress_pane col-9\">";
        progressBars += "<div class=\"progress mr-8\" style=\"height:10px\">";
        progressBars += "<div class=\"progress-bar\" role=\"progressbar\" style=\"width: " + perf + "%; background-color: " + generateColorCodeFromPerf(perf) + "\" aria-valuenow=\"25\" aria-valuemin=\"0\" aria-valuemax=\"100\">" + perf + "</div>";
        progressBars += "</div>";
        progressBars += "</div>";

        progressBars += "</div>";
    }

    if (totalPerf == 0) {
        progressBars = "<div class=\"none_logs text-muted h3 text-center font-italic\">There is no data uploaded to FF logs.</div>"
    }

    progressBarContainer.innerHTML = progressBars;
}

function generateSendLogsIcon(char, sendPageId) {
    var sendPageContainer = document.getElementById(sendPageId);
    var sendPageIcons = "";
    sendPageIcons += "<a class=\"text-dark\" href=\"" + "https://ja.fflogs.com/character/id/" + char.canonicalID + "\" target=\"_blank\" rel=\"noopener noreferrer\">";
    sendPageIcons += "<img class=\"m-2\" style=\"width:32px\" src=\"resource/web_icon/fflogs.png\">";
    sendPageIcons += "</a>";

    sendPageContainer.innerHTML += sendPageIcons;
}

function generateColorCodeFromPerf(perf) {
    if (0 < perf && perf < 25) {
        return "#696969";
    } else if (0 < perf && perf < 50) {
        return "#32CD32";
    } else if (0 < perf && perf < 75) {
        return "#0000CD";
    } else if (0 < perf && perf < 95) {
        return "#800080";
    } else if (0 < perf && perf < 99) {
        return "#FFA500";
    } else if (perf == 99) {
        return "#FF1493";
    } else if (perf == 100) {
        return "#FFFF00";
    } else {
        return "#000000";
    }
}

function generateGetCharacterDataQuery(data) {
    var linkshell = data.Linkshell;
    var query = "";
    query += "{\n";
    query += "characterData {\n";
    var i = 0
    for (i; i < linkshell.Results.length; i++) {
        var member = linkshell.Results[i];

        var replaceName = generateReplaceName(member.Name);
        var serverName = generateServerName(member.Server);
        var regionName = generateServerRegion(member.Server);

        query += replaceName + "_" + serverName + ":character(name: \"" + member.Name + "\", serverSlug: \"" + serverName + "\", serverRegion:\"" + regionName + "\") {\n";
        query += "canonicalID\n";
        query += "lodestoneID\n";
        query += "name\n";
        query += "server {\n";
        query += "name\n";
        query += "region {\n";
        query += "compactName\n";
        query += "}\n";
        query += "subregion {\n";
        query += "name\n";
        query += "}\n";
        query += "}\n";
        query += "zoneRankings\n";
        query += "}\n";
    }
    query += "}\n";
    query += "}\n"
    return query;
}

document.getElementById("bearer_token_button").addEventListener("click", function() {
    $.cookie('bearer_token', document.getElementById("bearer_token").value);
});

document.getElementById("cwls_id_button").addEventListener("click", function() {
    $.cookie('cwls_id', document.getElementById("cwls_id").value);
    if (document.getElementById("bearer_token").value) {
        generatePage(document.getElementById("bearer_token").value, document.getElementById("cwls_id").value);
    }
});
