//      Constants And Page Initialization

const body = document.querySelector('body');
const searchContainerDiv = document.querySelector("div.search-container");
const galleryDiv = document.getElementById('gallery');
//  The data from the API is stored here
const activeUserArray = [];
//  The Gallery Cards are stored in this array, in objects of the form
//  {"element":cardElement, "firstName":firstNameString, "lastName:lastNameString}
//  This facilitates filtering based on search results
const cardList = [];
//  The divs for the modal overlay are stored directly in this array
const modalList = [];

// Build the Search Box and Button
const searchForm = document.createElement('form');
searchContainerDiv.appendChild(searchForm);
searchForm.action = "#";
searchForm.method = "get";
const searchInput = document.createElement('input');
searchInput.type = "search";
searchInput.id = "search-input";
searchInput.className = "search-input";
searchInput.placeholder = "Search...";
const searchSubmit = document.createElement('input');
searchSubmit.type = "submit";
searchSubmit.value = "\u{1F50D}";
searchSubmit.id = "search-submit";
searchSubmit.className = "search-submit";
searchForm.appendChild(searchInput);
searchForm.appendChild(searchSubmit);
searchForm.addEventListener('submit', e => {
    e.preventDefault()
    filterGallery(searchInput.value);
});
searchForm.addEventListener('input', e => {
    filterGallery(searchInput.value)
    });

// Request Data from API, and build the Gallery
// Change argument to change number of users
buildGallery(12)




//      Call API and Build Gallery Functions

// function to call the API, parse the resulting response, and create an array
// of user information from the json
async function getUserData(url){
    const userArray = await fetch(url)
        .then(result => result.json())
        .then(jsonVal => jsonVal.results)
        .catch(error => {
            const errorMessage = document.createElement('p');
            errorMessage.textContent = "Network error.  Please refresh page.";
            galleryDiv.appendChild(errorMessage);
            return [];
        })
    return userArray;
}

// function to provide the api url and build the gallery 
// stores information in arrays so the API call is only made once
async function buildGallery(numberOfUsers) {
    // these countries use the English alphabet and have 10 digit phone numbers
    let url = `https://randomuser.me/api/?format=json&results=${numberOfUsers}&nat=us,ca,gb,au`;
    const userArray = await getUserData(url);
    activeUserArray.push(...userArray);
    buildModalList()
    for (let i = 0; i < activeUserArray.length; i++){
        const user = activeUserArray[i];
        const newCard = addGalleryCard(user.picture['medium'],
            user.name.first,
            user.name.last,
            user.email,
            user["location"].city,
            user["location"].state)
        newCard.addEventListener('click', e => showModalFor(i));
        cardList.push({"element":newCard,"firstName":user.name.first,"lastName":user.name.last})
    }
}

// function to create and add Gallery Card to the DOM
function addGalleryCard(imageSource,firstName,lastName,email,city,state) {
    const cardDiv = document.createElement('div');
    cardDiv.className = "card";
    galleryDiv.appendChild(cardDiv);
    const imageDiv = document.createElement('div');
    cardDiv.appendChild(imageDiv);
    imageDiv.innerHTML = `<img class="card-img" src="${imageSource}" alt="profile picture">`
    const cardInfoContainer = document.createElement('div');
    cardInfoContainer.className = "card-info-container";
    cardDiv.appendChild(cardInfoContainer);
    cardInfoContainer.innerHTML = 
        `<h3 id="name" class="card-name cap">${firstName} ${lastName}</h3>
        <p class="card-text">${email}</p>
        <p class="card-text cap">${city}, ${state}</p>`
    return cardDiv;
}




//      Functions to Make, Show, and Hide Modal Overlays


// Makes a modal element for each user, and stores it in the modalList array
// (called in the make gallery function)
function buildModalList() {
    for (let i = 0; i < activeUserArray.length; i++) {
        const user = activeUserArray[i];
        modalList[i] = buildModalContainer(
            user.picture.large,
            `${user.name.first} ${user.name.last}`,
            user.email,
            user['location'].city,
            formatCell(user),
            buildAddress(user),
            buildDOB(user));
    }
}

// Function to build (and return) a modal container element
function buildModalContainer(imageSource,name,email,city,phoneNumber,address,birthday) {
    const modalContainer = document.createElement('div');
    modalContainer.className = "modal-container";
    const modalDiv = document.createElement('div');
    modalDiv.className = "modal";
    modalContainer.appendChild(modalDiv);
    const modalCloseBtn = document.createElement('button');
    modalCloseBtn.type = "button";
    modalCloseBtn.id = "modal-close-btn";
    modalCloseBtn.className = "modal-close-btn";
    modalCloseBtn.innerHTML = "<strong>X</strong>";
    modalCloseBtn.addEventListener('click',makeCloseModal(modalContainer));
    modalDiv.appendChild(modalCloseBtn);
    const modalInfoContainer = document.createElement('div');
    modalInfoContainer.className = "modal-info-container";
    modalDiv.appendChild(modalInfoContainer);
    const modalImage = document.createElement('img');
    modalImage.className = "modal-img";
    modalImage.src = imageSource;
    modalImage.alt = "profile picture";
    modalInfoContainer.appendChild(modalImage);
    const h3 = document.createElement('h3');
    h3.id = "name";
    h3.className = "modal-name cap";
    h3.textContent = name;
    modalInfoContainer.appendChild(h3);
    addModalTextParagraph(modalInfoContainer,email);
    addModalTextParagraph(modalInfoContainer,city);
    modalInfoContainer.appendChild(document.createElement('hr'))
    addModalTextParagraph(modalInfoContainer,phoneNumber);
    addModalTextParagraph(modalInfoContainer,address);
    addModalTextParagraph(modalInfoContainer,"Birthday: "+birthday);
    return modalContainer;
}

// Helper Function for buildModalContainer
function addModalTextParagraph(parentNode,text) {
    const p = document.createElement('p');
    p.className = "modal-text";
    p.textContent = text;
    parentNode.appendChild(p);
}

// Displays the modal overlay for the user corresponding
// to the provided index
function showModalFor(userIndex) {
    body.appendChild(modalList[userIndex]);
    addModalNavButtons(modalList[userIndex],userIndex);
    for (let i = 0; i < modalList.length; i++) {
        if (i !== userIndex && modalList[i].parentNode === body) {
            body.removeChild(modalList[i]);
        } 
    }
}

// Creates a function to close the provided modalContainer
function makeCloseModal(modalContainer) {
    function removeModal() {
        // remove the navigation buttons from the div,
        // so we don't have to worry about id
        removeModalNavButtons(modalContainer);
        body.removeChild(modalContainer);
        }
    return removeModal
}

// Adds navigation buttons to the modal overlay
// Buttons are added and removed from modal div elements for 2 reasons:
// 1.  The button effect changes based on the current value of the search filter
// 2.  The buttons have id values, and id's should not be repeated in a DOM
function addModalNavButtons(modalContainer,modalIndex) {
    const btnContainer = document.createElement('div');
    btnContainer.className = "modal-btn-container";
    modalContainer.appendChild(btnContainer);
    const nextIndex = nextModalIndex(modalIndex);
    const previousIndex = previousModalIndex(modalIndex);
    const closeCurrentModal = makeCloseModal(modalContainer);
    const prevButton = document.createElement('button');
    btnContainer.appendChild(prevButton);
    prevButton.type="button";
    prevButton.id="modal-prev";
    prevButton.className="modal-prev btn";
    prevButton.textContent="Prev";
    if (previousIndex >= 0) {
        prevButton.addEventListener('click', e => {
            closeCurrentModal();
            showModalFor(previousIndex);
        });
    } else {
        prevButton.style.visibility = "hidden";
    }
    const nextButton = document.createElement('button');
    btnContainer.appendChild(nextButton);
    nextButton.type="button";
    nextButton.id="modal-next";
    nextButton.className="modal-next btn";
    nextButton.textContent="Next";
    if (nextIndex >= 0 ) {
        nextButton.addEventListener('click', e => {
            closeCurrentModal();
            showModalFor(nextIndex);
        });
    } else {
        nextButton.style.visibility = "hidden";
    }
}

// removes navigation buttons to the modal overlay
// Buttons are added and removed from modal div elements for 2 reasons:
// 1.  The button effect changes based on the current value of the search filter
// 2.  The buttons have id values, and id's should not be repeated in a DOM
function removeModalNavButtons(modalContainer){
    const btnContainer = modalContainer.querySelector('.modal-btn-container')
    const modalPrev = document.getElementById('modal-prev')
    const modalNext = document.getElementById('modal-next')
    btnContainer.removeChild(modalPrev);
    btnContainer.removeChild(modalNext);
    modalContainer.removeChild(btnContainer);
}

// returns the index of the next user that satisfies the current search
// criteria, or -1 if there are no such users
function nextModalIndex(currentIndex) {
    for (let i = currentIndex+1; i < modalList.length; i++) {
        const ithCard = cardList[i];
        if (nameMatches(ithCard.firstName,ithCard.lastName,searchInput.value)) {
            return i;
        }
    }
    return -1;
}

// returns the index of the prior user that satisfies the current search
// criteria, or -1 if there are no such users
function previousModalIndex(currentIndex) {
    for (let i = currentIndex-1; i >= 0; i--) {
        const ithCard = cardList[i];
        if (nameMatches(ithCard.firstName,ithCard.lastName,searchInput.value)) {
            return i;
        }
    }
    return -1;
}




//      Filtering Functions

// Filters the Gallery based on the search input
function filterGallery(searchString) {
    for (let i = 0; i < cardList.length; i++) {
        cardList[i].element.style.display = (nameMatches(cardList[i].firstName,cardList[i].lastName,searchString) ? "" : "none"); 
    }
}

// Determines if a first and last name match the search string
// (match happens even if no space between first and last name)
function nameMatches(firstName,lastName,searchString) {
    return `${firstName}${lastName}`.toLowerCase().includes(searchString.toLowerCase()) ||
           `${firstName} ${lastName}`.toLowerCase().includes(searchString.toLowerCase())
}




//      Data Formatting Functions

// takes a user, and returns a string of their full address
// If US Address, shows state instead of country.
function buildAddress(user) {
    if (user["location"].country === "United States") {
        return  `${user.location.street.number} ${user.location.street.name}, ${user.location.city}, ${user.location.state}, ${user.location.postcode}`;
    } else {
        return `${user.location.street.number} ${user.location.street.name}, ${user.location.city}, ${user.location.country}, ${user.location.postcode}`;
    }
}

// takes a user, and returns a string for their birthdate
function buildDOB(user) {
    let yearMonthDayStr = user.dob.date;
    const monthStr = yearMonthDayStr.substring(5,7);
    const dayStr = yearMonthDayStr.substring(8,10);
    const yearStr = yearMonthDayStr.substring(0,4);
    return monthStr+"/"+dayStr+"/"+yearStr;
}

// takes a user, and returns a formatted cell number
function formatCell(user) {
    let cellString = user.cell;
    cellString = cellString.replace(/[^\d]/g,"");
    cellString = `(${cellString.substring(0,3)}) ${cellString.substring(3,6)}-${cellString.substring(6,10)}`;
    return cellString
}


