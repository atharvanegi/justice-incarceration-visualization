let incarcerationData = {};
let parsedData = null;
let racialData = null;
let educationUnemploymentData = null;
let genderData = null;
let minRate = 0;
let maxRate = 0;
let colorScale;
let tooltip = d3.select("#tooltip");
let currentSection = 0;
let currentRaceFilter = 'all';
let currentRegionFilter = 'all';
const totalSections = document.querySelectorAll('.poem-paragraph').length;

document.addEventListener('DOMContentLoaded', function() {
  ensureParagraphsAreClickable();
  createAllContainers();
  setupParagraphClickEvents();
  setupNavigationButtons();
  setupFancyRegionTransitions();
  
  currentSection = 0;
  highlightCurrentSection();
  initializeFirstVisualization();
});

function createAllContainers() {
  if (!document.getElementById('racialContainer')) {
    const racialContainer = document.createElement('div');
    racialContainer.id = 'racialContainer';
    racialContainer.className = 'map-container';
    
    racialContainer.innerHTML = `
      <h2>Prison Population by Race in Top 5 Incarceration States</h2>
      <div class="race-filters">
        <button class="race-filter active" data-race="all">All Races</button>
        <button class="race-filter" data-race="white">White</button>
        <button class="race-filter" data-race="black">Black</button>
        <button class="race-filter" data-race="hispanic">Hispanic</button>
        <button class="race-filter" data-race="other">Other</button>
      </div>
      <div class="race-chart" id="raceChart">
        <div class="loading">Loading race data...</div>
      </div>
    `;
    
    const mapContainer = document.getElementById('mapContainer');
    mapContainer.parentNode.insertBefore(racialContainer, mapContainer.nextSibling);
    
    document.querySelectorAll('.race-filter').forEach(button => {
      button.addEventListener('click', function() {
        document.querySelectorAll('.race-filter').forEach(btn => {
          btn.classList.remove('active');
        });
        
        this.classList.add('active');
        currentRaceFilter = this.getAttribute('data-race');
        updateRacialDistributionChart();
      });
    });
    
    racialContainer.style.display = 'none';
  }
  
  if (!document.getElementById('eduUnemplContainer')) {
    const eduUnemplContainer = document.createElement('div');
    eduUnemplContainer.id = 'eduUnemplContainer';
    eduUnemplContainer.className = 'map-container';
    
    eduUnemplContainer.innerHTML = `
      <h2>Education vs. Unemployment Rate and Incarceration</h2>
      <div class="region-filters">
        <button class="region-filter active" data-region="all">All Regions</button>
        <button class="region-filter" data-region="Midwest">Midwest</button>
        <button class="region-filter" data-region="Northeast">Northeast</button>
        <button class="region-filter" data-region="South">South</button>
        <button class="region-filter" data-region="West">West</button>
      </div>
      <div class="scatter-chart" id="scatterChart">
        <div class="loading">Loading education and unemployment data...</div>
      </div>
    `;
    
    const racialContainer = document.getElementById('racialContainer');
    racialContainer.parentNode.insertBefore(eduUnemplContainer, racialContainer.nextSibling);
    
    eduUnemplContainer.style.display = 'none';
  }
  
  if (!document.getElementById('genderContainer')) {
    const genderContainer = document.createElement('div');
    genderContainer.id = 'genderContainer';
    genderContainer.className = 'map-container';
    
    genderContainer.innerHTML = `
      <h2>Distribution of Prison Population by Gender</h2>
      <div class="gender-content">
        <div class="gender-grid" id="genderGrid">
          <div class="loading">Loading gender data...</div>
        </div>
      </div>
    `;
    
    const eduUnemplContainer = document.getElementById('eduUnemplContainer');
    eduUnemplContainer.parentNode.insertBefore(genderContainer, eduUnemplContainer.nextSibling);
    
    genderContainer.style.display = 'none';
  }
}

function ensureParagraphsAreClickable() {
  const paragraphs = document.querySelectorAll('.poem-paragraph');
  
  paragraphs.forEach(para => {
    para.style.cursor = 'pointer';
    para.style.position = 'relative';
    para.style.zIndex = '10';
    para.style.padding = '10px';
    para.style.borderRadius = '5px';
    para.style.transition = 'all 0.3s ease';
  });
}

function setupParagraphClickEvents() {
  document.getElementById('para1').addEventListener('click', function() {
    hideEducationUnemploymentChart();
    hideRacialDistribution();
    hideGenderDistribution();
    
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer) mapContainer.style.display = 'block';
    
    loadData();
    
    currentSection = 0;
    highlightCurrentSection();
  });
  
  const para2 = document.getElementById('para2');
  para2.addEventListener('click', function() {
    hideMap();
    hideEducationUnemploymentChart();
    hideGenderDistribution();
    
    const racialContainer = document.getElementById('racialContainer');
    if (racialContainer) racialContainer.style.display = 'block';
    
    loadRacialDistributionData();
    
    currentSection = 1;
    highlightCurrentSection();
  });
  
  const para3 = document.getElementById('para3');
  para3.addEventListener('click', function() {
    hideMap();
    hideRacialDistribution();
    hideGenderDistribution();
    
    const eduUnemplContainer = document.getElementById('eduUnemplContainer');
    if (eduUnemplContainer) eduUnemplContainer.style.display = 'block';
    
    loadEducationUnemploymentData();
    
    currentSection = 2;
    highlightCurrentSection();
  });
  
  const para4 = document.getElementById('para4');
  para4.addEventListener('click', function() {
    hideMap();
    hideRacialDistribution();
    hideEducationUnemploymentChart();
    
    const genderContainer = document.getElementById('genderContainer');
    if (genderContainer) genderContainer.style.display = 'block';
    
    loadGenderDistributionData();
    
    currentSection = 3;
    highlightCurrentSection();
  });
}

function setupFancyRegionTransitions() {
  document.querySelectorAll('.region-filter').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      const prevRegion = currentRegionFilter;
      const targetRegion = this.getAttribute('data-region');
      
      if (prevRegion === targetRegion) return;
      
      this.classList.add('btn-pulse');
      setTimeout(() => {
        this.classList.remove('btn-pulse');
      }, 700);
      
      const chartDiv = document.getElementById('scatterChart');
      const currentViz = d3.select(chartDiv).select("svg");
      
      if (!currentViz.empty()) {
        currentViz
          .transition()
          .duration(300)
          .style("opacity", 0)
          .on("end", function() {
            currentRegionFilter = targetRegion;
            
            document.querySelectorAll('.region-filter').forEach(btn => {
              btn.classList.remove('active');
            });
            
            e.target.classList.add('active');
            
            updateEducationUnemploymentChart();
            
            d3.select("#scatterChart").select("svg")
              .style("opacity", 0)
              .transition()
              .duration(500)
              .style("opacity", 1);
          });
      } else {
        currentRegionFilter = targetRegion;
        
        document.querySelectorAll('.region-filter').forEach(btn => {
          btn.classList.remove('active');
        });
        this.classList.add('active');
        
        updateEducationUnemploymentChart();
      }
    });
  });
}

function setupNavigationButtons() {
  document.getElementById('prevBtn').addEventListener('click', navigateToPrevSection);
  document.getElementById('nextBtn').addEventListener('click', navigateToNextSection);
}

function initializeFirstVisualization() {
  hideRacialDistribution();
  hideEducationUnemploymentChart();
  hideGenderDistribution();
  
  const mapContainer = document.getElementById('mapContainer');
  if (mapContainer) {
    mapContainer.style.display = 'block';
  }
  
  loadData();
}

function navigateToPrevSection() {
  if (currentSection > 0) {
    currentSection--;
    highlightCurrentSection();
    
    if (currentSection === 0) {
      hideRacialDistribution();
      hideEducationUnemploymentChart();
      hideGenderDistribution();
      
      const mapContainer = document.getElementById('mapContainer');
      if (mapContainer) mapContainer.style.display = 'block';
      
      loadData();
    } else if (currentSection === 1) {
      hideMap();
      hideEducationUnemploymentChart();
      hideGenderDistribution();
      loadRacialDistributionData();
    } else if (currentSection === 2) {
      hideMap();
      hideRacialDistribution();
      hideGenderDistribution();
      loadEducationUnemploymentData();
    } else if (currentSection === 3) {
      hideMap();
      hideRacialDistribution();
      hideEducationUnemploymentChart();
      loadGenderDistributionData();
    }
  }
}

function navigateToNextSection() {
  if (currentSection < totalSections - 1) {
    currentSection++;
    highlightCurrentSection();
    
    if (currentSection === 1) {
      hideMap();
      hideEducationUnemploymentChart();
      hideGenderDistribution();
      loadRacialDistributionData();
    } else if (currentSection === 2) {
      hideMap();
      hideRacialDistribution();
      hideGenderDistribution();
      loadEducationUnemploymentData();
    } else if (currentSection === 3) {
      hideMap();
      hideRacialDistribution();
      hideEducationUnemploymentChart();
      loadGenderDistributionData();
    }
  }
}

function hideMap() {
  const mapContainer = document.getElementById('mapContainer');
  if (mapContainer) {
    mapContainer.style.display = 'none';
  }
}

function hideRacialDistribution() {
  const racialContainer = document.getElementById('racialContainer');
  if (racialContainer) {
    racialContainer.style.display = 'none';
  }
}

function hideEducationUnemploymentChart() {
  const eduUnemplContainer = document.getElementById('eduUnemplContainer');
  if (eduUnemplContainer) {
    eduUnemplContainer.style.display = 'none';
  }
}

function hideGenderDistribution() {
  const genderContainer = document.getElementById('genderContainer');
  if (genderContainer) {
    genderContainer.style.display = 'none';
  }
}

function highlightCurrentSection() {
  const paragraphs = document.querySelectorAll('.poem-paragraph');
  
  paragraphs.forEach((para, index) => {
    para.classList.remove('active', 'dimmed');
    
    if (index < currentSection) {
      para.classList.add('dimmed');
    } else if (index > currentSection) {
      para.classList.add('dimmed');
    } else {
      para.classList.add('active');
    }
  });
  
  if (currentSection === 0) {
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer) mapContainer.style.display = 'block';
    
    const racialContainer = document.getElementById('racialContainer');
    if (racialContainer) racialContainer.style.display = 'none';
    
    const eduUnemplContainer = document.getElementById('eduUnemplContainer');
    if (eduUnemplContainer) eduUnemplContainer.style.display = 'none';
    
    const genderContainer = document.getElementById('genderContainer');
    if (genderContainer) genderContainer.style.display = 'none';
  } else if (currentSection === 1) {
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer) mapContainer.style.display = 'none';
    
    const racialContainer = document.getElementById('racialContainer');
    if (racialContainer) racialContainer.style.display = 'block';
    
    const eduUnemplContainer = document.getElementById('eduUnemplContainer');
    if (eduUnemplContainer) eduUnemplContainer.style.display = 'none';
    
    const genderContainer = document.getElementById('genderContainer');
    if (genderContainer) genderContainer.style.display = 'none';
  } else if (currentSection === 2) {
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer) mapContainer.style.display = 'none';
    
    const racialContainer = document.getElementById('racialContainer');
    if (racialContainer) racialContainer.style.display = 'none';
    
    const eduUnemplContainer = document.getElementById('eduUnemplContainer');
    if (eduUnemplContainer) eduUnemplContainer.style.display = 'block';
    
    const genderContainer = document.getElementById('genderContainer');
    if (genderContainer) genderContainer.style.display = 'none';
  } else if (currentSection === 3) {
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer) mapContainer.style.display = 'none';
    
    const racialContainer = document.getElementById('racialContainer');
    if (racialContainer) racialContainer.style.display = 'none';
    
    const eduUnemplContainer = document.getElementById('eduUnemplContainer');
    if (eduUnemplContainer) eduUnemplContainer.style.display = 'none';
    
    const genderContainer = document.getElementById('genderContainer');
    if (genderContainer) genderContainer.style.display = 'block';
  } else {
    const mapContainer = document.getElementById('mapContainer');
    if (mapContainer) mapContainer.style.display = 'none';
    
    const racialContainer = document.getElementById('racialContainer');
    if (racialContainer) racialContainer.style.display = 'none';
    
    const eduUnemplContainer = document.getElementById('eduUnemplContainer');
    if (eduUnemplContainer) eduUnemplContainer.style.display = 'none';
    
    const genderContainer = document.getElementById('genderContainer');
    if (genderContainer) genderContainer.style.display = 'none';
  }
}

async function loadData() {
  try {
    if (document.querySelector('.map svg')) {
      return;
    }
    
    document.getElementById('map').innerHTML = '<div class="loading">Loading map data...</div>';
    
    const response = await fetch('final_processed.csv');
    const csvData = await response.text();
    
    Papa.parse(csvData, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: function(results) {
        processData(results.data);
        createMap();
      },
      error: function(error) {
        document.getElementById('map').innerHTML = 
          '<div class="error">Error loading data. Please try again.</div>';
      }
    });
  } catch (error) {
    document.getElementById('map').innerHTML = 
      '<div class="error">Error loading data. Please try again.</div>';
  }
}

function processData(data) {
  parsedData = { data: data };
  
  data.forEach(row => {
    if (row.State && row.total_prison_population && row.total_state_population) {
      const rate = (row.total_prison_population / row.total_state_population) * 100;
      incarcerationData[row.State] = parseFloat(rate.toFixed(2));
    }
  });
  
  const rates = Object.values(incarcerationData);
  minRate = Math.min(...rates);
  maxRate = Math.max(...rates);
  
  const maxRateForScale = 3;
  colorScale = d3.scaleLinear()
    .domain([minRate, maxRateForScale])
    .range(["#e6f2ff", "#0039a6"])
    .clamp(true);
}

async function createMap() {
  try {
    const mapDiv = document.getElementById('map');
    mapDiv.innerHTML = '';
    
    const width = mapDiv.clientWidth;
    const height = 400;
    
    const svg = d3.select("#map")
      .append("svg")
      .attr("width", width)
      .attr("height", height);
    
    const projection = d3.geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale(width);
    
    const path = d3.geoPath()
      .projection(projection);
    
    const us = await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json");
    const states = topojson.feature(us, us.objects.states).features;
    
    const stateNames = {};
    us.objects.states.geometries.forEach(state => {
      stateNames[state.id] = state.properties.name;
    });
    
    svg.selectAll(".state")
      .data(states)
      .enter()
      .append("path")
      .attr("class", "state")
      .attr("d", path)
      .attr("fill", d => {
        const stateName = stateNames[d.id];
        return incarcerationData[stateName] ? colorScale(incarcerationData[stateName]) : "#ccc";
      })
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .on("mouseover", function(event, d) {
        const stateName = stateNames[d.id];
        const rate = incarcerationData[stateName] || "No data";
        
        d3.select(this)
          .attr("stroke", "#000")
          .attr("stroke-width", 1.5);
        
        tooltip.style("display", "block")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px");
        
        const stateData = parsedData.data.find(row => row.State === stateName);
        let tooltipContent = '';
        
        if (stateData) {
          let rateCategory = "";
          if (rate < 0.1) rateCategory = "very low";
          else if (rate < 0.5) rateCategory = "low";
          else if (rate < 1.0) rateCategory = "moderate";
          else if (rate < 5.0) rateCategory = "high";
          else rateCategory = "very high";
          
          tooltipContent = `
            <strong>${stateName}</strong><br>
            <b>${rate}%</b> of population in prison<br>
            <small>(${rateCategory} incarceration rate)</small><br>
            Prison Population: ${stateData.total_prison_population.toLocaleString()}<br>
            State Population: ${stateData.total_state_population.toLocaleString()}
          `;
        } else {
          tooltipContent = `
            <strong>${stateName}</strong><br>
            ${typeof rate === "number" ? `${rate}% of population in prison` : rate}
          `;
        }
        
        document.getElementById("tooltip").innerHTML = tooltipContent;
      })
      .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY + 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5);
        
        tooltip.style("display", "none");
      });
    
    createLegend(minRate, maxRate);
    
  } catch (error) {
    document.getElementById('map').innerHTML = 
      '<div class="error">Error creating map. Please try again.</div>';
  }
}

function createLegend(min, max) {
  const legendDiv = document.getElementById('legend');
  legendDiv.innerHTML = '';
  
  const maxForLegend = 3;
  
  const legendHtml = `
    <div>
      <div class="legend-color-scale"></div>
      <div class="legend-labels">
        <span>${min.toFixed(2)}%</span>
        <span>${(min + (maxForLegend - min) / 4).toFixed(2)}%</span>
        <span>${(min + (maxForLegend - min) / 2).toFixed(2)}%</span>
        <span>${(min + 3 * (maxForLegend - min) / 4).toFixed(2)}%</span>
        <span>3%+</span>
      </div>
    </div>
  `;
  
  legendDiv.innerHTML = legendHtml;
}

function processRacialData() {
  if (!parsedData || !parsedData.data) {
    return;
  }
  
  try {
    const stateData = parsedData.data.map(row => {
      if (row.State && row.total_prison_population && row.total_state_population) {
        const prison_white = Number(row.prison_white) || 0;
        const prison_black = Number(row.prison_black) || 0;
        const prison_hispanic = Number(row.prion_hispanic) || 0;
        const prison_other = Number(row.prison_other) || 0;
        
        const total = prison_white + prison_black + prison_hispanic + prison_other;
        
        if (total > 0) {
          const incarcerationRate = (row.total_prison_population / row.total_state_population) * 100;
          
          const whitePercent = (prison_white / total) * 100;
          const blackPercent = (prison_black / total) * 100;
          const hispanicPercent = (prison_hispanic / total) * 100;
          const otherPercent = (prison_other / total) * 100;
          
          return {
            state: row.State,
            incarcerationRate: parseFloat(incarcerationRate.toFixed(2)),
            prisonPopulation: row.total_prison_population,
            racialDistribution: {
              white: parseFloat(whitePercent.toFixed(2)),
              black: parseFloat(blackPercent.toFixed(2)),
              hispanic: parseFloat(hispanicPercent.toFixed(2)),
              other: parseFloat(otherPercent.toFixed(2))
            },
            rawCounts: {
              white: prison_white,
              black: prison_black,
              hispanic: prison_hispanic,
              other: prison_other
            }
          };
        }
      }
      return null;
    }).filter(item => item !== null);
    
    if (stateData.length === 0) {
      return;
    }
    
    racialData = [...stateData].sort((a, b) => b.incarcerationRate - a.incarcerationRate).slice(0, 5);
  } catch (error) {
    // Handle error silently
  }
}

async function loadRacialDistributionData() {
  try {
    if (racialData && racialData.length > 0) {
      updateRacialDistributionChart();
      return;
    }
    
    const racialContainer = document.getElementById('racialContainer');
    if (racialContainer) {
      racialContainer.style.display = 'block';
    }
    
    const chartDiv = document.getElementById('raceChart');
    if (chartDiv) {
      chartDiv.innerHTML = '<div class="loading">Loading race data...</div>';
    }
    
    if (!parsedData || !parsedData.data) {
      const response = await fetch('final_processed.csv');
      const csvData = await response.text();
      
      Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
          parsedData = results;
          processRacialData();
          updateRacialDistributionChart();
        },
        error: function(error) {
          document.getElementById('raceChart').innerHTML = 
            '<div class="error">Error loading data. Please try again.</div>';
        }
      });
    } else {
      processRacialData();
      updateRacialDistributionChart();
    }
  } catch (error) {
    document.getElementById('raceChart').innerHTML = 
      '<div class="error">Error loading data. Please try again.</div>';
  }
}

function updateRacialDistributionChart() {
  const chartDiv = document.getElementById('raceChart');
  chartDiv.innerHTML = '';
  
  if (!racialData || racialData.length === 0) {
    chartDiv.innerHTML = '<div class="error">No race data available. Please try again.</div>';
    return;
  }
  
  try {
    const margin = { top: 60, right: 60, bottom: 80, left: 70 };
    const width = chartDiv.clientWidth - margin.left - margin.right;
    const height = 550 - margin.top - margin.bottom;
    
    const svg = d3.select("#raceChart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const races = ['white', 'black', 'hispanic', 'other'];
    const raceColors = {
      white: '#4287f5',
      black: '#f54278',
      hispanic: '#43cc71',
      other: '#55d6e3'
    };
    
    const states = racialData.map(d => d.state);
    const x0 = d3.scaleBand()
      .domain(states)
      .rangeRound([0, width])
      .paddingInner(0.3)
      .paddingOuter(0.15);
    
    const x1 = d3.scaleBand()
      .domain(races)
      .rangeRound([0, x0.bandwidth()])
      .padding(0.15);
    
    const maxPercentage = 60;
    const y = d3.scaleLinear()
      .domain([0, maxPercentage])
      .range([height, 0])
      .nice();
    
    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "rgba(255, 255, 255, 0.02)")
      .attr("rx", 8);
    
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat("")
        .ticks(10)
      )
      .selectAll("line")
      .style("stroke", "rgba(255, 255, 255, 0.08)")
      .style("stroke-dasharray", "3,3");
    
    const stateBars = svg.selectAll(".state")
      .data(racialData)
      .enter()
      .append("g")
      .attr("class", "state")
      .attr("transform", d => `translate(${x0(d.state)},0)`);
    
    races.forEach(race => {
      stateBars.append("rect")
        .attr("class", `bar ${race}`)
        .attr("x", d => x1(race))
        .attr("y", height)
        .attr("width", x1.bandwidth())
        .attr("height", 0)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("fill", d => {
          if (currentRaceFilter === 'all' || currentRaceFilter === race) {
            return raceColors[race];
          }
          return 'rgba(255, 255, 255, 0.1)';
        })
        .attr("stroke", raceColors[race])
        .attr("stroke-width", 1.5)
        .attr("opacity", d => {
          return (currentRaceFilter === 'all' || currentRaceFilter === race) ? 1 : 0.5;
        })
        .transition()
        .duration(800)
        .delay((d, i) => i * 100)
        .attr("y", d => y(d.racialDistribution[race]))
        .attr("height", d => height - y(d.racialDistribution[race]));
        
      stateBars.selectAll(`.bar.${race}`)
        .on("mouseover", function(event, d) {
          d3.select(this)
            .attr("stroke-width", 3)
            .attr("opacity", 1)
            .style("filter", "brightness(1.1)");
          
          const raceValue = d.racialDistribution[race];
          const rawCount = d.rawCounts[race];
          const totalPop = d.prisonPopulation;
          
          tooltip.style("display", "block")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px")
            .html(`
              <strong>${d.state}</strong><br>
              <span style="color:${raceColors[race]};font-weight:600">${race.charAt(0).toUpperCase() + race.slice(1)}</span>: ${raceValue.toFixed(1)}%<br>
              Population: ${rawCount.toLocaleString()} people<br>
              Total prison population: ${totalPop.toLocaleString()}
            `);
        })
        .on("mousemove", function(event) {
          tooltip.style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function() {
          d3.select(this)
            .attr("stroke-width", 1.5)
            .attr("opacity", (currentRaceFilter === 'all' || currentRaceFilter === race) ? 1 : 0.5)
            .style("filter", null);
          
          tooltip.style("display", "none");
        });
    });
    
    svg.append("path")
      .attr("d", `M0,${height}H${width}`)
      .attr("stroke", "rgba(255, 255, 255, 0.3)")
      .attr("stroke-width", 1.5);
      
    states.forEach((state, i) => {
      const xPos = x0(state) + x0.bandwidth() / 2;
      
      svg.append("text")
        .attr("class", "state-label")
        .attr("x", xPos)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "white")
        .style("font-family", "'Helvetica Neue', Arial, sans-serif")
        .text(state);
    });
    
    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y)
        .tickFormat(d => d + "%")
        .ticks(10)
        .tickSize(-5)
      )
      .call(g => g.select(".domain").remove())
      .selectAll("text")
      .style("font-size", "13px")
      .style("fill", "white")
      .style("font-family", "'Helvetica Neue', Arial, sans-serif");
    
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("fill", "white")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("% of Prison Population");
    
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "22px")
      .style("fill", "white")
      .style("font-weight", "bold")
      .text("Prison Population by Race");
    
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2 + 30)
      .attr("text-anchor", "middle")
      .style("font-size", "15px")
      .style("fill", "rgba(255, 255, 255, 0.8)")
      .text("Top 5 states with highest incarceration rates");
    
    const legendSpacing = width / 5;
    const legendY = height + 65;
    
    races.forEach((race, i) => {
      const legendX = (i * legendSpacing) + (legendSpacing / 2);
      
      svg.append("rect")
        .attr("x", legendX - 60)
        .attr("y", legendY)
        .attr("width", 20)
        .attr("height", 20)
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("fill", raceColors[race]);
      
      svg.append("text")
        .attr("x", legendX - 35)
        .attr("y", legendY + 15)
        .style("font-size", "14px")
        .style("fill", "white")
        .style("font-weight", "500")
        .text(race.charAt(0).toUpperCase() + race.slice(1));
    });
  } catch (error) {
    chartDiv.innerHTML = '<div class="error">Error creating chart. Please try again.</div>';
  }
}

async function loadEducationUnemploymentData() {
  try {
    let eduUnemplContainer = document.getElementById('eduUnemplContainer');
    if (eduUnemplContainer) {
      eduUnemplContainer.style.display = 'block';
    } else {
      eduUnemplContainer = document.createElement('div');
      eduUnemplContainer.id = 'eduUnemplContainer';
      eduUnemplContainer.className = 'map-container';
      
      eduUnemplContainer.innerHTML = `
        <h2>Education vs. Unemployment Rate and Incarceration</h2>
        <div class="region-filters">
          <button class="region-filter active" data-region="all">All Regions</button>
          <button class="region-filter" data-region="Midwest">Midwest</button>
          <button class="region-filter" data-region="Northeast">Northeast</button>
          <button class="region-filter" data-region="South">South</button>
          <button class="region-filter" data-region="West">West</button>
        </div>
        <div class="scatter-chart" id="scatterChart">
          <div class="loading">Loading education and unemployment data...</div>
        </div>
      `;
      
      const mapContainer = document.getElementById('mapContainer');
      if (mapContainer && mapContainer.parentNode) {
        mapContainer.parentNode.insertBefore(eduUnemplContainer, mapContainer.nextSibling);
      } else {
        const visSection = document.querySelector('.visualization-section');
        if (visSection) {
          visSection.appendChild(eduUnemplContainer);
        }
      }
    }
    
    const chartDiv = document.getElementById('scatterChart');
    if (chartDiv) {
      chartDiv.innerHTML = '<div class="loading">Loading education and unemployment data...</div>';
    }
    
    if (!parsedData || !parsedData.data) {
      const response = await fetch('final_processed.csv');
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
      }
      
      const csvData = await response.text();
      
      Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
          parsedData = results;
          processEducationUnemploymentData();
          updateEducationUnemploymentChart();
        },
        error: function(error) {
          document.getElementById('scatterChart').innerHTML = 
            '<div class="error">Error loading data. Please try again.</div>';
        }
      });
    } else {
      processEducationUnemploymentData();
      updateEducationUnemploymentChart();
    }
  } catch (error) {
    document.getElementById('scatterChart').innerHTML = 
      '<div class="error">Error loading data: ' + error.message + '</div>';
  }
}

function processEducationUnemploymentData() {
  if (!parsedData || !parsedData.data) {
    return;
  }
  
  const regions = {
    "Connecticut": "Northeast", "Maine": "Northeast", "Massachusetts": "Northeast", "New Hampshire": "Northeast",
    "Rhode Island": "Northeast", "Vermont": "Northeast", "New Jersey": "Northeast", "New York": "Northeast",
    "Pennsylvania": "Northeast", "Illinois": "Midwest", "Indiana": "Midwest", "Michigan": "Midwest",
    "Ohio": "Midwest", "Wisconsin": "Midwest", "Iowa": "Midwest", "Kansas": "Midwest", "Minnesota": "Midwest",
    "Missouri": "Midwest", "Nebraska": "Midwest", "North Dakota": "Midwest", "South Dakota": "Midwest",
    "Delaware": "South", "Florida": "South", "Georgia": "South", "Maryland": "South", "North Carolina": "South",
    "South Carolina": "South", "Virginia": "South", "West Virginia": "South", "Alabama": "South", 
    "Kentucky": "South", "Mississippi": "South", "Tennessee": "South", "Arkansas": "South", "Louisiana": "South",
    "Oklahoma": "South", "Texas": "South", "Arizona": "West", "Colorado": "West", "Idaho": "West",
    "Montana": "West", "Nevada": "West", "New Mexico": "West", "Utah": "West", "Wyoming": "West",
    "Alaska": "West", "California": "West", "Hawaii": "West", "Oregon": "West", "Washington": "West"
  };
  
  educationUnemploymentData = parsedData.data
    .filter(row => row && typeof row === 'object' && row.State)
    .map(row => {
      const educationRate = row['2021'] !== undefined && row['2021'] !== null ? parseFloat(row['2021']) : null;
      const unemploymentRate = row.annual_unemployment_rate_2021 !== undefined && row.annual_unemployment_rate_2021 !== null 
        ? parseFloat(row.annual_unemployment_rate_2021) : null;
      
      if (educationRate !== null && unemploymentRate !== null) {
        const totalPrison = row.total_prison_population || 0;
        const totalPop = row.total_state_population || 1;
        const incarcerationRate = (totalPrison / totalPop) * 100;
        
        return {
          state: row.State,
          education: educationRate,
          unemployment: unemploymentRate,
          incarceration: parseFloat(incarcerationRate.toFixed(2)),
          region: regions[row.State] || "Other",
          totalPop: totalPop,
          prisonPop: totalPrison
        };
      }
      return null;
    })
    .filter(item => item !== null);
}

function updateEducationUnemploymentChart() {
  const chartDiv = document.getElementById('scatterChart');
  if (!chartDiv) {
    return;
  }
  
  chartDiv.innerHTML = '';
  
  if (!educationUnemploymentData || educationUnemploymentData.length === 0) {
    chartDiv.innerHTML = '<div class="error">No data available for education chart</div>';
    return;
  }
  
  const filteredData = currentRegionFilter === 'all' 
    ? educationUnemploymentData 
    : educationUnemploymentData.filter(d => d.region === currentRegionFilter);
  
  const margin = { top: 60, right: 50, bottom: 120, left: 70 };
  const width = chartDiv.clientWidth - margin.left - margin.right;
  const height = 550 - margin.top - margin.bottom;
  
  const svg = d3.select("#scatterChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "rgba(255, 255, 255, 0.02)")
    .attr("rx", 8);
  
  const regionColors = {
    "Midwest": "#F9C74F",
    "Northeast": "#F94144",
    "South": "#4361EE",
    "West": "#43AA8B",
    "Other": "#999999"
  };
  
  const xMin = 20;
  const xMax = 50;
  const yMin = 2;
  const yMax = 8;
  
  const x = d3.scaleLinear()
    .domain([xMin, xMax])
    .range([0, width])
    .nice();
  
  const y = d3.scaleLinear()
    .domain([yMin, yMax])
    .range([height, 0])
    .nice();
  
  const sizeExtent = d3.extent(educationUnemploymentData, d => d.incarceration);
  
  const size = d3.scaleSqrt()
    .domain([0, Math.max(3, sizeExtent[1])])
    .range([6, 35]);
  
  svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .tickSize(-height)
      .tickFormat("")
      .ticks(7)
    )
    .selectAll("line")
    .style("stroke", "rgba(255, 255, 255, 0.07)")
    .style("stroke-dasharray", "3,3");
  
  svg.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat("")
      .ticks(6)
    )
    .selectAll("line")
    .style("stroke", "rgba(255, 255, 255, 0.07)")
    .style("stroke-dasharray", "3,3");
  
  const circles = svg.selectAll(".circle-dot")
    .data(filteredData)
    .enter()
    .append("circle")
    .attr("class", "circle-dot")
    .attr("cx", d => x(d.education))
    .attr("cy", d => y(d.unemployment))
    .attr("r", 0)
    .style("fill", d => regionColors[d.region] || "#999")
    .style("fill-opacity", 0.7)
    .style("stroke", d => regionColors[d.region] || "#999")
    .style("stroke-width", 1.5)
    .style("stroke-opacity", 0.9)
    .style("cursor", "pointer")
    .transition()
    .duration(800)
    .delay((d, i) => i * 20)
    .attr("r", d => size(d.incarceration || 0.1));
  
  svg.selectAll(".circle-dot")
    .on("mouseover", function(event, d) {
      d3.select(this)
        .style("fill-opacity", 0.9)
        .style("stroke-width", 3)
        .style("filter", "brightness(1.2)");
      
      const tooltipContent = `
        <strong>${d.state}</strong><br>
        <span style="color:${regionColors[d.region]}">Region: ${d.region}</span><br>
        Higher Education: ${d.education.toFixed(1)}%<br>
        Unemployment Rate: ${d.unemployment.toFixed(1)}%<br>
        Incarceration Rate: ${d.incarceration.toFixed(2)}%<br>
        ${d.prisonPop ? 'Prison Population: ' + d.prisonPop.toLocaleString() : ''}
      `;
      
      tooltip.style("display", "block")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px")
        .html(tooltipContent);
    })
    .on("mousemove", function(event) {
      tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", function() {
      d3.select(this)
        .style("fill-opacity", 0.7)
        .style("stroke-width", 1.5)
        .style("filter", null);
      
      tooltip.style("display", "none");
    });
  
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .tickFormat(d => d + "%")
      .ticks(7))
    .selectAll("text")
      .style("fill", "rgba(255, 255, 255, 0.8)")
      .style("font-size", "12px")
      .attr("y", 10);

  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y)
      .tickFormat(d => d + "%")
      .ticks(6))
    .selectAll("text")
      .style("fill", "rgba(255, 255, 255, 0.8)")
      .style("font-size", "12px");
  
  svg.append("text")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 35)
    .style("fill", "white")
    .style("font-size", "16px")
    .style("font-weight", "500")
    .text("Higher Education Rate");
  
  svg.append("text")
    .attr("class", "axis-label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 20)
    .style("fill", "white")
    .style("font-size", "16px")
    .style("font-weight", "500")
    .text("Unemployment Rate");
  
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("fill", "white")
    .style("font-weight", "bold")
    .text("Education vs. Unemployment by State");
  
  const legendX = width / 2 - 180;
  const legendY = height + 65;
  
  const regionLegend = svg.append("g")
    .attr("class", "region-legend")
    .attr("transform", `translate(${legendX}, ${legendY})`);
  
  Object.keys(regionColors).forEach((region, i) => {
    if (region !== "Other") {
      const legendRow = regionLegend.append("g")
        .attr("transform", `translate(${i * 100}, 0)`);
      
      legendRow.append("circle")
        .attr("r", 7)
        .attr("cx", 8)
        .attr("cy", 0)
        .style("fill", regionColors[region])
        .style("fill-opacity", 0.8)
        .style("stroke", regionColors[region]);
      
      legendRow.append("text")
        .attr("x", 20)
        .attr("y", 4)
        .style("font-size", "13px")
        .style("font-weight", "500")
        .style("fill", "white")
        .text(region);
    }
  });
  
  const disclaimerG = svg.append("g")
    .attr("class", "axis-disclaimer-group")
    .attr("transform", `translate(${width/2}, ${height + 95})`);
  
  disclaimerG.append("rect")
    .attr("x", -175)
    .attr("y", -12)
    .attr("width", 350)
    .attr("height", 25)
    .attr("rx", 12)
    .attr("fill", "rgba(212, 188, 140, 0.25)");
    
  disclaimerG.append("text")
    .attr("class", "axis-disclaimer")
    .attr("text-anchor", "middle")
    .attr("x", 0)
    .attr("y", 5)
    .style("fill", "#FFFFFF")
    .style("font-size", "14px")
    .style("font-weight", "500")
    .text("Note: X-axis starts at 20%, Y-axis starts at 2%");
    
  if (currentRegionFilter !== 'all') {
    svg.append("text")
      .attr("class", "region-indicator")
      .attr("text-anchor", "start")
      .attr("x", 10)
      .attr("y", 30)
      .style("fill", regionColors[currentRegionFilter])
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .style("opacity", 0)
      .text(`Showing ${currentRegionFilter} Region`)
      .transition()
      .duration(500)
      .style("opacity", 1);
  }
}

async function loadGenderDistributionData() {
  try {
    if (genderData) {
      updateGenderDistributionChart();
      return;
    }
    
    let genderContainer = document.getElementById('genderContainer');
    if (genderContainer) {
      genderContainer.style.display = 'block';
    }
    
    if (!parsedData) {
      const response = await fetch('final_processed.csv');
      const csvData = await response.text();
      
      Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
          parsedData = results;
          processGenderData();
          updateGenderDistributionChart();
        },
        error: function(error) {
          document.getElementById('genderGrid').innerHTML = 
            '<div class="error">Error loading data. Please try again.</div>';
        }
      });
    } else {
      processGenderData();
      updateGenderDistributionChart();
    }
  } catch (error) {
    document.getElementById('genderGrid').innerHTML = 
      '<div class="error">Error loading data. Please try again.</div>';
  }
}

function processGenderData() {
  if (!parsedData) return;

  let totalMale = 0;
  let totalFemale = 0;
  let totalPrison = 0;

  parsedData.data.forEach(row => {
    if (row.prison_male && row.prison_female) {
      totalMale += row.prison_male;
      totalFemale += row.prison_female;
      totalPrison += row.prison_male + row.prison_female;
    }
  });

  const malePercentage = (totalMale / totalPrison) * 100;
  const femalePercentage = (totalFemale / totalPrison) * 100;

  genderData = {
    male: {
      count: totalMale,
      percentage: malePercentage
    },
    female: {
      count: totalFemale,
      percentage: femalePercentage
    },
    total: totalPrison
  };
}

function updateGenderDistributionChart() {
  const genderGrid = document.getElementById('genderGrid');
  genderGrid.innerHTML = '';

  if (!genderData) {
    genderGrid.innerHTML = '<div class="loading">No data available</div>';
    return;
  }

  const title = document.createElement('div');
  title.className = 'gender-title';
  title.textContent = 'Prison Population Distribution by Gender';
  genderGrid.appendChild(title);

  const femalePercentage = Math.round(genderData.female.percentage);
  const malePercentage = Math.round(genderData.male.percentage);

  const totalIcons = 50;
  const femaleIcons = Math.max(1, Math.round((femalePercentage / 100) * totalIcons));
  const maleIcons = totalIcons - femaleIcons;

  const columns = 10;
  const rows = 5;

  const femaleIconDataUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCA0OCI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI2IiBmaWxsPSIjZmY0ZDZkIj48L2NpcmNsZT48cG9seWdvbiBwb2ludHM9IjIwLDQwIDQsNDAgMTIsMTYiIGZpbGw9IiNmZjRkNmQiPjwvcG9seWdvbj48L3N2Zz4=';
  const maleIconDataUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCA0OCI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI2IiBmaWxsPSIjNDM2MWVlIj48L2NpcmNsZT48cmVjdCB4PSI4IiB5PSIxNiIgd2lkdGg9IjgiIGhlaWdodD0iMjQiIGZpbGw9IiM0MzYxZWUiPjwvcmVjdD48L3N2Zz4=';

  const container = d3.select('#genderGrid');

  for (let i = 0; i < rows; i++) {
    const row = container.append('div')
      .attr('class', 'gender-row');
    
    for (let j = 0; j < columns; j++) {
      const index = i * columns + j;
      
      const isFemale = index < femaleIcons;
      const iconSrc = isFemale ? femaleIconDataUrl : maleIconDataUrl;
      const iconClass = isFemale ? 'female' : 'male';
      
      row.append('img')
        .attr('class', `gender-icon ${iconClass}`)
        .attr('src', iconSrc)
        .attr('width', '20')
        .attr('height', '40')
        .attr('alt', isFemale ? 'Female Icon' : 'Male Icon')
        .on('mouseover', function() {
          d3.select(this).classed('highlighted', true);
        })
        .on('mouseout', function() {
          d3.select(this).classed('highlighted', false);
        });
    }
  }

  const legend = document.createElement('div');
  legend.className = 'gender-legend';

  const femaleLegend = document.createElement('div');
  femaleLegend.className = 'gender-legend-item';
  femaleLegend.innerHTML = `
    <img class="gender-legend-icon" src="${femaleIconDataUrl}" width="20" height="40" alt="Female Icon">
    <span class="gender-legend-label">Female</span>
  `;

  const maleLegend = document.createElement('div');
  maleLegend.className = 'gender-legend-item';
  maleLegend.innerHTML = `
    <img class="gender-legend-icon" src="${maleIconDataUrl}" width="20" height="40" alt="Male Icon">
    <span class="gender-legend-label">Male</span>
  `;

  legend.appendChild(femaleLegend);
  legend.appendChild(maleLegend);
  genderGrid.appendChild(legend);

  const statsContainer = document.createElement('div');
  statsContainer.className = 'stats-container';

  const femaleStats = document.createElement('div');
  femaleStats.className = 'stat-box female';
  femaleStats.innerHTML = `
    <div class="stat-title">Female</div>
    <div class="stat-value">${femalePercentage.toFixed(1)}%</div>
    <div class="stat-subtitle">${genderData.female.count.toLocaleString()} people</div>
  `;

  const maleStats = document.createElement('div');
  maleStats.className = 'stat-box male';
  maleStats.innerHTML = `
    <div class="stat-title">Male</div>
    <div class="stat-value">${malePercentage.toFixed(1)}%</div>
    <div class="stat-subtitle">${genderData.male.count.toLocaleString()} people</div>
  `;

  const totalStats = document.createElement('div');
  totalStats.className = 'stat-box total';
  totalStats.innerHTML = `
    <div class="stat-title">Total Prison Population</div>
    <div class="stat-value">${genderData.total.toLocaleString()}</div>
    <div class="stat-subtitle">Across All States</div>
  `;

  statsContainer.appendChild(femaleStats);
  statsContainer.appendChild(maleStats);
  statsContainer.appendChild(totalStats);
  genderGrid.appendChild(statsContainer);
}