
/* ------------------------------------------------------------------------- *\
*                 Веб-приложение по поиску фильмов и сериалов
\* ------------------------------------------------------------------------- */

console.log('Hello from Cinema Finder!');


/* -------------------- Глобальные сущности и настройки -------------------- */

// DOM-объекты элементов пользовательского интерфейса
const titleInput = document.getElementById('title');
const typeSelect = document.getElementById('type');
const searchButton = document.getElementById('search-button');
const statusOutput = document.getElementById('status-output');
const searchResultsContainer = document.getElementById('search-results-container');


// Создание объекта сетевого запроса AJAX
const request = new XMLHttpRequest();

// Установка типа ожидаемого ответа
request.responseType = 'json';

// API-ключ
const apiKey = 'babd72f9-9560-4373-a5c3-9e8caae771fc';

// Состояние параметров поиска
let title, type;


/* --------------------- Отправка поисковых запросов ----------------------- */

// Регистрация слушателя и обработчика события click на кнопке для запуска первоначального поиска
searchButton.addEventListener('click', processInitialRequest);

// Функция для обработка начального запроса поиска
function processInitialRequest() {
    // Отмена запроса в случае отсутствия заголовка title
    if (!titleInput.value) {
        updateStatus('Пустой заголовок\nПожалуйста введите заголовок для выполнения поиска');
        return;
    }

    // Отмена запроса в случае повторения входных данных title и type
    if (titleInput.value == title && typeSelect.value == type) {
        updateStatus('Повторение заголовка и типа\nПожалуйста введите новый заголовок или тип для выполнения поиска');
        return;
    }

    // Отмена запроса в случае несоответствия title к шаблону
    const regexp = /^[a-zа-яё0-9][a-zа-яё0-9 ,.!?&/\-–:;'"№#]+$/i;

    if (!regexp.test(titleInput.value)) {
        updateStatus('Ошибка в заголовке\nЗаголовок должен состоять и начинаться с букв или цифр и может иметь пробелы и знаки пунктуации');
        titleInput.value = '';
        return;
    }


    // Заголовок искомого фильма/сериала
    title = titleInput.value;
    titleInput.value = '';
    // Тип искомого кинематографического произведения
    type = typeSelect.value;

    // Вывод данных на веб-страницу для пользователя
    statusOutput.innerText = 'Загрузка...';

    // Очистка результатов предыдущего поиска
    const cinemaCards = searchResultsContainer.querySelectorAll('.cinema-card');
    for (const cinemaCard of cinemaCards) {
        cinemaCard.remove();
    }

    // Формирование URL-адреса
    const url = `https://kinopoiskapiunofficial.tech/api/v2.2/films?order=RATING&ratingFrom=0&ratingTo=10&yearFrom=1000&yearTo=3000&type=${type}&keyword=${title}&page=1`;
    sendRequest(url);


    // Функция для обновления статуса
    function updateStatus(statusText) {
        const prevStatus = statusOutput.innerText;
        statusOutput.innerText = statusText;

        if (prevStatus) {
            setTimeout(() => {
                statusOutput.innerText = prevStatus;
            }, 10e3);
        }
    }
}

// Функция для отправки запроса
function sendRequest(url) {
    // Инициализация
    request.open('GET', url);
    request.setRequestHeader('X-API-KEY', apiKey);

    // Отправка запроса
    request.send();
    console.log('request sent');
    console.time('request');
}


/* -------------------- Обработка поисковых результатов -------------------- */

// Регистрация слушателя и обработчика события на получение ответа
request.addEventListener('load', processResponse);

/* request.onreadystatechange = function() {
    console.log('request.readyState :>> ', request.readyState);
}; */

request.onerror = function() {
    console.log('request :>> ', request);
};


// Функция обработки ответа
function processResponse() {
    console.timeEnd('request');
    console.log('request :>> ', request);
    console.log('response :>> ', request.response);
    
    if (request.status == 200) {
        // Строка с типом для вывода
        const typeString = typeSelect.selectedOptions[0].text;

        // Вывод данных на веб-страницу для пользователя
        statusOutput.innerText = `${typeString} со словами в названии "${title}"`;

        if ('items' in request.response) {
            processSearchResults(request.response.items);
        } else {
            processDetails(request.response);
        }
    } else {
        console.log('request statusText :>> ', request.statusText);
    }
}

// Обработка результатов поиска
function processSearchResults(searchResults) {
    console.log('processSearchResults >> searchResults :>> ', searchResults);

    searchResults.forEach(function(result) {
        const {
            posterUrl: poster,
            nameRu: title,
            ratingKinopoisk: rating,
            year,
            kinopoiskId
        } = result;
    
        // Создание новых HTML-элементов
        const card =
            `<div class="cinema-card" data-kinopoisk-id="${kinopoiskId}">
                <div class="poster">
                    <img src="${poster}" alt="Poster of ${title}">
                </div>
                <div class="info">
                    <div class="rating-favorite-container">
                        <p class="rating">Рейтинг ${rating}</p>
                    </div>
                    <h6 class="title">${title}</h6>
                    <p class="year">Год выпуска ${year}</p>
                </div>
            </div>`;
        
        // Вставка нового HTML-элемента
        searchResultsContainer.insertAdjacentHTML('beforeend', card);
    });
}


// Обработка событий клика по карточкам
searchResultsContainer.addEventListener('click', processDetailsResponse);

// Функция для отправки запроса детальной информации по фильму
function processDetailsResponse(event) {
    const card = event.target.closest('div.cinema-card');
    console.log('processDetailsResponse >> card :>> ', card);
    
    if (card) {
        const kinopoiskId = card.dataset.kinopoiskId;
        const url = `https://kinopoiskapiunofficial.tech/api/v2.2/films/${kinopoiskId}`;
        sendRequest(url);
    }
}

// Функция для вывода детальной информации по фильму
function processDetails(cinemaFullInfo) {    
    // Деструктуризация объекта
    const {
        posterUrl: poster,
        ratingKinopoisk: rating,
        nameOriginal: title,
        genres,
        countries,
        year,
        shortDescription: description,
        webUrl
    } = cinemaFullInfo;

    // Создание новых HTML-элементов
    const cinemaFullCard =
        `<div id="fixed-container">
            <div id="cinema-full-card">
                <div class="poster">
                    <img src="${poster}" alt="Poster of ${title}">
                </div>
                <div class="info">
                    <p class="rating">${rating}</p>
                    <h2 class="title">${title}</h2>
                    <h3 class="genre">
                        ${ genres.map(item => item.genre)
                            .join(', ')
                            .replace(/^./, letter => letter.toUpperCase()) }
                    </h3>
                    <h3 class="countries">
                        ${ countries.map(item => item.country).join(', ') }
                    </h3>
                    <p class="year">${year}</p>
                    <p class="description">${description}</p>
                    <a href="${webUrl}" target="_blank">Ссылка на Кинопоиск</a>
                </div>
                <button>&times;</button>
            </div>
        </div>`;
        
    // Вставка нового HTML-элемента
    document.body.insertAdjacentHTML('beforeend', cinemaFullCard);

    // Отключение прокрутки
    document.body.style.width = getComputedStyle(document.body).width;
    document.body.style.overflow = 'hidden';

    // Закрытие окна
    const fixedContainer = document.getElementById('fixed-container');

    const removeFixedContainer = () => {
        fixedContainer.remove();
        document.body.style.width = '';
        document.body.style.overflow = '';
    };

    document.querySelector('#cinema-full-card button')
        .addEventListener('click', function() {
            removeFixedContainer();
        }, { once: true });

    fixedContainer.addEventListener('click', function(event) {
        if (event.target.matches('#fixed-container')) {
            removeFixedContainer();
        }
    }, { once: true });
}
