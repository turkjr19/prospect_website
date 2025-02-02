// Example player data to simulate the API response
const players = [
    { name: 'Alexander Hague', playerID: '628137' },
    { name: 'Raiden Doxtater', playerID: '897396' },
    { name: 'Elijah Chavez', playerID: '906006' },
    { name: 'Johnny Brooks', playerID: '887871' },
    { name: 'Louis Sturgeon', playerID: '897413' },
];

// Function to populate the player dropdown
function populatePlayerDropdown() {
    const playerSelect = document.getElementById('playerSelect');

    players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.playerID;
        option.textContent = player.name;
        playerSelect.appendChild(option);
    });
}

// Function to load player data based on selected player
async function loadPlayerData() {
    const playerId = document.getElementById('playerSelect').value;
    
    if (!playerId) {
        alert('Please select a player.');
        return;
    }

    const apiUrl = `https://api.eliteprospects.com/v1/players/${playerId}/game-logs?offset=0&limit=100&sort=-game.dateTime&apiKey=0cMWKbnl12KJusOFQZjZK7BVLYLP343e`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();
        const gameLogs = data.data;

        // Filter only the 2024-2025 season
        const filteredLogs = gameLogs.filter(log => log.game.season.slug === '2024-2025');

        // Sort by date DESCENDING (latest game first)
        filteredLogs.sort((a, b) => new Date(b.game.dateTime) - new Date(a.game.dateTime));

        let cumulativePoints = 0;
        let cumulativePointsList = [];

        // Calculate cumulative points correctly
        filteredLogs.slice().reverse().forEach(log => {
            cumulativePoints += log.stats.PTS || 0;
            cumulativePointsList.push(cumulativePoints);
        });

        // Reverse cumulative points for table display ONLY
        const reversedCumulativePointsList = [...cumulativePointsList].reverse();

        // Generate table with all games
        let tableData = '';
        filteredLogs.forEach((log, i) => {
            const seasonSlug = log.game.season.slug || 'N/A';
            const league = log.game.league.name || 'N/A';
            const date = new Date(log.game.dateTime).toLocaleDateString();
            const team = log.teamName || 'N/A';
            const opposition = log.opponentName || 'N/A';
            const G = log.stats.G || 0;
            const A = log.stats.A || 0;
            const PTS = log.stats.PTS || 0;
            let correctCumulativePoints = reversedCumulativePointsList[i];

            tableData += `
                <tr>
                    <td>${seasonSlug}</td>
                    <td>${league}</td>
                    <td>${date}</td>
                    <td>${team}</td>
                    <td>${opposition}</td>
                    <td>${G}</td>
                    <td>${A}</td>
                    <td>${PTS}</td>
                    <td>${correctCumulativePoints}</td>
                </tr>
            `;
        });

        document.getElementById('gameLogs').querySelector('tbody').innerHTML = tableData;

        // Calculate EMA (Exponential Moving Average)
        const emaPeriod = 5;
        const emaData = calculateEMA(cumulativePointsList, emaPeriod);

        // Draw the chart
        drawCumulativePointsChart(
            filteredLogs.map((_, index) => `G${index + 1}`).reverse(),
            cumulativePointsList,
            emaData
        );

    } catch (error) {
        console.error('Error fetching game logs:', error);
        alert('An error occurred while fetching the game logs.');
    }
}

// Function to draw the chart
function drawCumulativePointsChart(labels, data, emaData) {
    const canvas = document.getElementById('cumulativePointsChart');

    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    const ctx = canvas.getContext('2d');

    // Destroy existing chart if it exists
    if (window.cumulativeChart instanceof Chart) {
        window.cumulativeChart.destroy();
    }

    // Create Chart.js Line Chart
    window.cumulativeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Cumulative Points',
                    data: data,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: '#007bff',
                    fill: true,
                },
                {
                    label: 'EMA (5 games)',
                    data: emaData,
                    borderColor: 'red',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Game Number'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Cumulative Points'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

// Function to calculate EMA (Exponential Moving Average)
function calculateEMA(data, period) {
    if (data.length < period) return data;

    const ema = [];
    const alpha = 2 / (period + 1);

    ema[0] = data[0];

    for (let i = 1; i < data.length; i++) {
        ema[i] = alpha * data[i] + (1 - alpha) * ema[i - 1];
    }

    return ema;
}

// Populate dropdown with player names when the page loads
document.addEventListener('DOMContentLoaded', populatePlayerDropdown);
