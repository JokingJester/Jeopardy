document.addEventListener('DOMContentLoaded', function () {
   const playBtn = document.getElementById("play");
  const menuScreen = document.querySelector(".menu-screen");
  const tableContainer = document.querySelector(".table-container");

  playBtn.addEventListener("click", () => {
    //---Hide the menu---
    menuScreen.style.display = "none";

    //---Show the grid---
    tableContainer.classList.remove("hidden");
  });
  const API_URL = "https://rithm-jeopardy.herokuapp.com/api/"; //URL of API
  const NUMBER_OF_CATEGORIES = 6; 
  const NUMBER_OF_CLUES_PER_CATEGORY = 5; 

  let categories = [];
  let activeClue = null;
  let activeClueMode = 0; 
  let questionsRemaining = 30; //Their will always be 30 questions on the board. Once its 0 the game is over
  let isPlayButtonClickable = true;
  let isAnimating = true;

  const activeClueOverlay = document.getElementById("active-clue"); // Overlay element

  $("#play").on("click", handleClickOfPlay); //Play + Restart button logic

  function handleClickOfPlay() { //Function sets up the game board when clicking button
    if (isPlayButtonClickable === true) {
      document.querySelector(".menu-screen").classList.add("hidden"); 
      setupTheGame();
      isPlayButtonClickable = false;
    }
  }

  async function setupTheGame() { //Resets categories array, questions remaining variable, and 
    categories = [];
    questionsRemaining = 30;
    $("#spinner").show();
    $("#categories").empty();
    $("#clues").empty();
    $("#active-clue").html("").removeClass("active");
    const categoryIDs = await getCategoryIds();
    for (let id of categoryIDs) {
      const data = await getCategoryData(id);
      categories.push(data);
    }
    fillTable(categories);
    $("#spinner").hide();
  }

  async function getCategoryIds() { //Retrieves
    const res = await axios.get(API_URL + `categories?count=100`);
    let validCategoryID = res.data.filter(category => category.clues_count >= NUMBER_OF_CLUES_PER_CATEGORY);
    validCategoryID = validCategoryID.sort(() => 0.5 - Math.random());
    const chosen = validCategoryID.slice(0, NUMBER_OF_CATEGORIES);
    const ids = chosen.map(category => category.id);
    return ids;
  }

  async function getCategoryData(categoryId) { //Retrieves title, questions, and answers from API
    const res = await axios.get(API_URL + `category?id=` + categoryId);
    const categoryWithClues = {
      id: categoryId,
      title: res.data.title,
      clues: res.data.clues.slice(0, NUMBER_OF_CLUES_PER_CATEGORY)
    };
    return categoryWithClues;
  }

  function fillTable(categories) { //Adds HTML elements on screen to display table
    const tableHead = document.getElementById("categories");
    const tableBody = document.getElementById("clues");
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    for (let i = 0; i < categories.length; i++) {
      const th = document.createElement("th");
      th.textContent = categories[i].title;
      tableHead.appendChild(th);
    }

    for (let clueIndex = 0; clueIndex < NUMBER_OF_CLUES_PER_CATEGORY; clueIndex++) {
      const tr = document.createElement("tr");
      for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
        const clue = categories[categoryIndex].clues[clueIndex];
        const td = document.createElement("td");
        td.classList.add("clue");

        const span = document.createElement("span");
        span.textContent = "$" + (clueIndex + 1) * 200;
        span.style.cursor = "pointer";
        td.addEventListener("click", () => handleClickOfClue(td, clue));

        td.appendChild(span);
        tr.appendChild(td);
      }
      tableBody.appendChild(tr);
    }
  }

  function handleClickOfClue(td, clue) {
    questionsRemaining--;
    activeClue = clue;
    activeClueMode = 1;

    td.innerHTML = "";
    td.style.pointerEvents = "none";

    // --- Expanded overlay animation ---
    const rect = td.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    activeClueOverlay.style.transformOrigin = `${x}px ${y}px`;
    activeClueOverlay.textContent = activeClue.question;
    
    activeClueOverlay.classList.add("active");
    isAnimating = true;
     setTimeout(() => { //Disables mouse clicks until overlay animation completes
    isAnimating = false;
  }, 500); // 500ms matches the CSS transition duration
  }

  $("#active-clue").on("click", handleClickOfActiveClue);

  function handleClickOfActiveClue(event) {
    if(isAnimating == true)
      return;
    
    if (activeClueMode === 1) {
      activeClueMode = 2;
      $("#active-clue").html(activeClue.answer);
    } 

    else if (activeClueMode === 2) {
      
      //---Checks if the player finished the game---
      if (questionsRemaining === 0 && isPlayButtonClickable === false) {
        isPlayButtonClickable = true;
        $("#active-clue").html("The End!");
        return; // We return so then the player has to click the end to go back to the main menu.
      }
      
      //---Displays main menu---
      else if(questionsRemaining === 0 && isPlayButtonClickable === true){
        menuScreen.style.display = "flex"; //Shows main menu
        $("#play").text("Restart the Game!");
      }

      //---Sets active clue mode to 0 and removes overlay. This returns players to the main menu as well---
      activeClueMode = 0;
      $("#active-clue").html(null).removeClass("active");
    }
  }
});