import { database, ref, get } from './firebase.js';
async function retrieveDataFromFirebase(timeRange) {
  const ordersRef = ref(database, 'ordersForGraph');
  try {
    const snapshot = await get(ordersRef);
    const data = snapshot.val();
    if (!data) {
      console.error('No data retrieved from Firebase');
      return [];
    }
    const ordersArray = Object.keys(data).map(orderId => ({
      x: data[orderId].timestamp,
      y: parseFloat(data[orderId].overallTotal.replace(/[^\d.]/g, ''))
    }));
    const filteredData = filterDataByTimeRange(ordersArray, timeRange);
    filteredData.sort((a, b) => {
      return a.x - b.x;
    });
    var total = 0
    filteredData.forEach(yelement => {
      total += yelement.y
    });
    document.querySelector(".progress-bar").textContent = `₱${total}`
    var strongday = `D A Y`
    if (timeRange == "day") {
      var strongday = `D A Y`
    } else if (timeRange == "week") {
      var strongday = `W E E K`
    } else if (timeRange == "month") {
      var strongday = `M O N T H `
    } else if (timeRange == "annual") {
      var strongday = `A N N U A L`
    };
    document.querySelector(".strong-day").textContent = strongday
    return filteredData;
  } catch (error) {
    console.error('Error fetching data from Firebase:', error);
    return [];
  }
}
function filterDataByTimeRange(data, timeRange) {
  switch (timeRange) {
    case 'day':
      const now = new Date();
      const filteredDataByHour = data.reduce((accumulator, entry) => {
        const entryTime = new Date(entry.x);
        const entryDate = new Date(
          entryTime.getFullYear(),
          entryTime.getMonth(),
          entryTime.getDate()
        );
        const nowDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        if (entryDate.getTime() === nowDate.getTime()) {
          const entryHour = entryTime.getHours();
          const existingEntry = accumulator.find(item => {
            const itemTime = new Date(item.x);
            return itemTime.getHours() === entryHour;
          });
          if (existingEntry) {
            existingEntry.y += entry.y;
          } else {
            accumulator.push(entry);
          }
        }

        return accumulator;
      }, []);
      return filteredDataByHour;

    case 'week':
      const filteredDataByDay = data.reduce((accumulator, entry) => {
        const entryTime = new Date(entry.x);
        const entryDay = new Date(
          entryTime.getFullYear(),
          entryTime.getMonth(),
          entryTime.getDate()
        );
        const existingEntry = accumulator.find(item => {
          const itemTime = new Date(item.x);
          const itemDay = new Date(
            itemTime.getFullYear(),
            itemTime.getMonth(),
            itemTime.getDate()
          );
          return itemDay.getTime() === entryDay.getTime();
        });
        if (existingEntry) {
          existingEntry.y += entry.y;
        } else {
          accumulator.push(entry);
        }
        return accumulator;
      }, []);
      return filteredDataByDay;
    case 'month':
      const filteredDataByWeek = data.reduce((accumulator, entry) => {
        const entryTime = new Date(entry.x);
        const entryWeek = new Date(
          entryTime.getFullYear(),
          entryTime.getMonth(),
          entryTime.getDate() - entryTime.getDay()
        );
        const existingEntry = accumulator.find(item => {
          const itemTime = new Date(item.x);
          const itemWeek = new Date(
            itemTime.getFullYear(),
            itemTime.getMonth(),
            itemTime.getDate() - itemTime.getDay()
          );
          return itemWeek.getTime() === entryWeek.getTime();
        });
        if (existingEntry) {
          existingEntry.y += entry.y;
        } else {
          accumulator.push(entry);
        }
        return accumulator;
      }, []);
      return filteredDataByWeek;
    case 'annual':
      const filteredDataByMonth = data.reduce((accumulator, entry) => {
        const entryTime = new Date(entry.x);
        const entryMonth = new Date(
          entryTime.getFullYear(),
          entryTime.getMonth(),
          1
        );
        const existingEntry = accumulator.find(item => {
          const itemTime = new Date(item.x);
          const itemMonth = new Date(
            itemTime.getFullYear(),
            itemTime.getMonth(),
            1
          );
          return itemMonth.getTime() === entryMonth.getTime();
        });
        if (existingEntry) {
          existingEntry.y += entry.y;
        } else {
          accumulator.push(entry);
        }
        return accumulator;
      }, []);
      return filteredDataByMonth;
    default:
      return data;
  }
}
let myChart
async function createOrUpdateChart(timeRange) {
  const firebaseData = await retrieveDataFromFirebase(timeRange);
  const data = {
    datasets: [{
      label: 'Sales',
      data: firebaseData,
      backgroundColor: 'rgba(255, 172, 100, 0.1)',
      borderColor: 'rgba(255, 172, 100, 1)',
      borderWidth: 1,
      fill: 'origin',
      cubicInterpolationMode: 'monotone'
    }]
  };
  if (timeRange == "day") {
    var unitx = "hour"
    var typex = "bar"
  } else if (timeRange == "week") {
    var unitx = "day"
    var typex = "bar"
  } else if (timeRange == "month") {
    var unitx = "week"
    var typex = "line"
  } else if (timeRange == "annual") {
    var unitx = "month"
    var typex = "line"
  }
  const initialConfig = {
    type: typex,
    options: {
      aspectRatio: 2,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: unitx
          },
          ticks: {
            color: '#fff'
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#fff'
          },
        }
      },
      plugins: {
        labels: {
          fontColor: '#fff'
        }
      }
    }
  };
  const updatedConfig = Object.assign({}, initialConfig, { data });
  if (myChart) {
    myChart.destroy();
    myChart = ""
    createOrUpdateChart(timeRange)
  } else {
    myChart = new Chart(document.getElementById('myChart'), updatedConfig);
  }
}
const buttons = document.querySelectorAll('.time-range-button');
createOrUpdateChart('day')
buttons.forEach(button => {
  button.addEventListener('click', () => {
    const timeRange = button.value;
    createOrUpdateChart(timeRange);
    buttons.forEach(otherButton => {
      if (otherButton === button) {
        otherButton.classList.add('selected');
      } else {
        otherButton.classList.remove('selected');
      }
    });
  });
});
document.querySelector('.print').addEventListener('click', printPOS)
function printPOS() {
  const posElement = document.querySelector('.POS');
  document.querySelector('.POS').style.width = "100%"
  document.querySelector('.POS').style.marginTop = "0"
  document.querySelector('.site-name').style.display = "none"
  document.querySelector('nav').style.display = "none"
  document.querySelector('.print').style.display = "none"
  document.querySelector('.searchxuser').style.display = "none"
  document.querySelector('.POS').style.height = "100vh"
  document.querySelector('canvas').style.width = "100%"
  document.querySelector('.POS').style.position = "fixed"
  document.querySelectorAll('.time-range-button').forEach((button) => {
    button.style.display = "none";
  });
  if (posElement) {
    window.print();
  } else {
    console.error('Element with class .POS not found.');
  }
  document.querySelector('.POS').style.width = ""

  document.querySelector('.POS').style.height = ""
  document.querySelector('nav').style.display = ""
  document.querySelector('.site-name').style.display = ""
  document.querySelector('.searchxuser').style.display = ""
  document.querySelector('.print').style.display = ""
  document.querySelector('.POS').style.position = ""
  document.querySelector('.POS').style.marginTop = "50px"
  document.querySelectorAll('.time-range-button').forEach((button) => {
    button.style.display = "";
  });
}