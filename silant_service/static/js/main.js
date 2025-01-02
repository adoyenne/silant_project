document.addEventListener("DOMContentLoaded", () => {
    // Инициализация вкладок
    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach(button => {
        button.addEventListener("click", event => {
            const tabId = button.dataset.tab; // Получаем ID вкладки из data-tab
            openTab(event, tabId);
        });
    });

    // Добавляем обработчик для кнопки поиска
    const searchButton = document.getElementById("search-button");
    if (searchButton) {
        searchButton.addEventListener("click", searchMachine);
    }

    // Обработчик кнопки экспорта в Excel
    const exportButton = document.getElementById("export-excel-button");
    if (exportButton) {
        exportButton.addEventListener("click", exportToExcel);
    }


});

// Функция открытия вкладок
function openTab(event, tabId) {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    // Убираем активный класс у всех кнопок и вкладок
    tabButtons.forEach(button => button.classList.remove("active"));
    tabContents.forEach(content => content.classList.remove("active"));

    // Добавляем активный класс к выбранной вкладке и показываем соответствующую таблицу
    event.currentTarget.classList.add("active");

    // Скрываем все таблицы
    tabContents.forEach(content => content.style.display = "none");

    // Показываем таблицу только для выбранной вкладки
    const selectedTabContent = document.getElementById(tabId);
    if (selectedTabContent) {
        selectedTabContent.style.display = "block"; // Показываем выбранную таблицу
    }
}

// Функция поиска машины
function searchMachine() {
    const serialInput = document.getElementById("serial");
    const serialNumber = serialInput ? serialInput.value.trim() : null;

    // Проверяем, если заводской номер пустой
    if (!serialNumber) {
        fetchError("Введите заводской номер!");
        return;
    }

    // Загружаем данные для машины и проверяем, существует ли такой серийный номер
    fetchData(`/api/machines/?serial_number=${serialNumber}`, function(data) {
        // Очищаем предыдущие таблицы перед загрузкой новых
        clearPreviousTables();

        // Если номер не найден в базе данных
        if (data.length === 0) {
            fetchError("Машина с таким номером не найдена.");
            return;  // Прекращаем выполнение, если серийный номер не найден
        }

        // Если номер корректный, показываем таблицы и выполняем дальнейшие запросы
        resetfetchError("Неверный ввод.")
        showTables(serialNumber);
    });
}

// Функция для отображения ошибки
function fetchError(message) {
    const serialInputField = document.getElementById("serial");
    const searchButton = document.getElementById("search-button");

    // Показываем ошибку в поле ввода
    serialInputField.style.borderColor = "red";  // Красная рамка у поля
    serialInputField.style.backgroundColor = "#ffdddd"; // Красный фон поля ввода

    // Ищем блок для ошибки, если он есть
    let errorText = document.getElementById("error-text");

    if (!errorText) {
        // Если блока ошибки нет, создаем его
        errorText = document.createElement("div");
        errorText.id = "error-text";
        errorText.style.color = "red";  // Устанавливаем красный цвет для текста ошибки
        errorText.style.fontSize = "12px";  // Размер шрифта для ошибки
        serialInputField.parentElement.appendChild(errorText);
    }

    // Устанавливаем сообщение об ошибке
    errorText.textContent = message;  // Используем переданное сообщение или дефолтное
}

//Функция для сброса ошибки
function resetfetchError() {
    const serialInputField = document.getElementById("serial");
    const searchButton = document.getElementById("search-button");
    const errorText = document.getElementById("error-text");

    // Убираем красную рамку и фон у поля ввода
    serialInputField.style.borderColor = "";
    serialInputField.style.backgroundColor = "";

    // Убираем сообщение об ошибке
    if (errorText) {
        errorText.remove();
    }

}

// Функция для очистки предыдущих таблиц
function clearPreviousTables() {
    // Скрываем все таблицы
    const tabContents = document.querySelectorAll(".tabs, .tab-content, #export-excel-button");
    tabContents.forEach(content => content.style.display = "none");



    // Очищаем данные внутри таблиц
    tabContents.forEach(content => {
        const table = content.querySelector("table");
        if (table) {
            table.innerHTML = "";
        }
    });
}

// Функция для показа таблиц и вкладок
function showTables(serialNumber) {
    // Показываем вкладки и таблицы
    document.querySelectorAll(".tabs, .tab-content, #export-excel-button").forEach(element => {
        element.style.display = "block"; // Показываем вкладки и таблицы
    });

    // Сначала показываем только таблицу для "Общей информации"
    openTab({ currentTarget: document.querySelector('.tab-button[data-tab="machine-tab"]') }, "machine-tab");

    // Загружаем данные для каждой вкладки с передачей serialNumber
    fetchData(`/api/maintenances/?serial_number=${serialNumber}`, (data) => populateMaintenanceTab(data, serialNumber));
    fetchData(`/api/claims/?serial_number=${serialNumber}`, (data) => populateClaimsTab(data, serialNumber));

    // Заполняем данные для машины
    fetchData(`/api/machines/?serial_number=${serialNumber}`, (data) => populateMachineTab(data, serialNumber));
}


// Универсальная функция для запросов
function fetchData(url, callback) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status}`);
            }
            return response.json();
        })
        .then(data => callback(data))
        .catch(error => {
            console.error(`Ошибка при запросе ${url}:`, error);
            fetchError("Произошла ошибка при запросе данных.");
        });
}

function initializeDataTable(selector, defaultSortColumn, sortDirection) {
    $(selector).DataTable({
        "order": [[defaultSortColumn, sortDirection]],
        "paging": true,
        "searching": true,
        "ordering": true,
        "info": true,
        "lengthChange": false, // Отключаем изменение числа строк на странице
        "language": {
            "url": "/static/js/ru.json" // Относительный путь к файлу ru.json
        }
    });
}

// Функция для получения данных из reference
function fetchReferenceData(entityName) {
    const url = `/api/references/?entity_name=${encodeURIComponent(entityName)}`;
    return fetch(url)
        .then(response => response.json())
        .catch(error => console.error('Ошибка загрузки данных:', error));
}

function loadUserReferenceData() {
    fetch('/api/user_references/')
        .then(response => response.json())
        .then(data => {
            // Очищаем списки перед заполнением
            document.querySelectorAll('.client-select').forEach(select => {
                select.innerHTML = '<option value="">Выберите клиента</option>';
                const clientUsers = data.filter(item => item.groups.includes('client'));
                clientUsers.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.user.id;
                    option.textContent = item.user.first_name;
                    select.appendChild(option);
                });
            });

            document.querySelectorAll('.service-company-select').forEach(select => {
                select.innerHTML = '<option value="">Выберите сервисную компанию</option>';
                const serviceCompanyUsers = data.filter(item => item.groups.includes('service_company'));
                serviceCompanyUsers.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.user.id;
                    option.textContent = item.user.first_name;
                    select.appendChild(option);
                });
            });
        })
        .catch(error => console.error('Ошибка при загрузке данных пользователей:', error));
}

// Загрузка данных для выпадающих списков
function loadReferenceData() {

    // Загружаем данные для модели техники
    fetchReferenceData('Модель техники').then(data => {
        document.querySelectorAll('.model-select').forEach(select => {
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                select.appendChild(option);
            });
        });
    });

    // Загружаем данные для модели двигателя
    fetchReferenceData('Модель двигателя').then(data => {
        document.querySelectorAll('.engine-model-select').forEach(select => {
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                select.appendChild(option);
            });
        });
    });

    // Загружаем данные для модели трансмиссии
    fetchReferenceData('Модель трансмиссии').then(data => {
        document.querySelectorAll('.transmission-model-select').forEach(select => {
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                select.appendChild(option);
            });
        });
    });

    // Загружаем данные для модели ведущего моста
    fetchReferenceData('Модель ведущего моста').then(data => {
        document.querySelectorAll('.drive-axle-model-select').forEach(select => {
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                select.appendChild(option);
            });
        });
    });


    // Загружаем данные для модели управляемого моста
    fetchReferenceData('Модель управляемого моста').then(data => {
        document.querySelectorAll('.steer-axle-model-select').forEach(select => {
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                select.appendChild(option);
            });
        });
    });


    fetchReferenceData('Вид ТО').then(data => {
        document.querySelectorAll('.maintenance-type-select').forEach(select => {
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                select.appendChild(option);
            });
        });
    });

    fetchReferenceData('Организация').then(data => {
        document.querySelectorAll('.organization-select').forEach(select => {
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                select.appendChild(option);
            });
        });
    });

    fetchReferenceData('Узел отказа').then(data => {
        document.querySelectorAll('.failed-node-select').forEach(select => {
            select.innerHTML = '<option value="">Выберите узел отказа</option>';
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                select.appendChild(option);
            });
        });
    });

    fetchReferenceData('Способ восстановления').then(data => {
        document.querySelectorAll('.recovery-method-select').forEach(select => {
            select.innerHTML = '<option value="">Выберите способ восстановления</option>';
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = item.name;
                select.appendChild(option);
            });
        });
    });
}


function populateMachineTab(data, serialNumber) {
    const resultDiv = document.getElementById('machine-result');
    resultDiv.innerHTML = ''; // Очистка перед добавлением новой таблицы
    if (!resultDiv) {
        console.error('Элемент #machine-result не найден');
        return;
    }

    // Проверяем, имеет ли пользователь доступ к действиям
    const userGroups = JSON.parse(document.getElementById('user-groups-data').textContent);
    const hasActionAccess = userGroups.includes('manager');


    let resultHTML = '<table id="machine-table" border="1"><thead><tr>';
    const columnHeaders = [
        "№ п/п", "Модель техники", "Зав. № машины", "Модель двигателя", "Зав. № двигателя",
        "Модель трансмиссии (производитель, артикул)", "Зав. № трансмиссии", "Модель ведущего моста",
        "Зав. № ведущего моста", "Модель управляемого моста", "Зав. № управляемого моста",
        "Дата отгрузки с завода", "Покупатель", "Грузополучатель (конечный потребитель)",
        "Адрес поставки (эксплуатации)", "Комплектация (доп. опции)", "Сервисная компания"
    ];



    // Добавляем заголовок "Действия" только если есть доступ
    if (hasActionAccess) {
        columnHeaders.push("Действия");
    }


    columnHeaders.forEach(header => resultHTML += `<th>${header}</th>`);
    resultHTML += '</tr></thead><tbody>';

    data.forEach((item, index) => {
        // Печать item для проверки
        //console.log('Item:', item); // Здесь выводится объект item
        resultHTML += createRowMachine(item, index, false, hasActionAccess);
    });

    resultHTML += '</tbody></table>';


     // Добавляем кнопку "Добавить строку" только если есть доступ
    if (hasActionAccess) {
        resultHTML += '<button id="add-row-machine-button">Добавить строку</button>';
    }

    resultDiv.innerHTML = resultHTML;


    loadUserReferenceData();

    // Инициализируем кнопки "Подробнее" для клиента и сервисной компании
    addUserDetailsButtons();

        // Инициализируем сортировку таблицы
    initializeDataTable('#machine-table', 11, 'desc');  //

    // Инициализируем события для строк
    initializeRowEventListenersMachine();
}

// Создание строки таблицы для техники
function createRowMachine(item, index, isEditable, hasActionAccess) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return !isNaN(date) ? date.toISOString().split('T')[0] : ''; // Формат для <input type="date">
    };

    let actionsHTML = '';
    if (hasActionAccess) {
        actionsHTML = `
            <button class="edit-row-machine-button" style="display: ${isEditable ? 'none' : 'block'}">Изменить</button>
            <button class="save-row-machine-button" style="display: ${isEditable ? 'block' : 'none'}">Сохранить</button>
            <button class="delete-row-machine-button">Удалить</button>
        `;
    }

    const row = `
        <tr data-id="${item.recordId || ''}" data-index="${index}">

            <td>${index + 1}</td>

            <!-- Модель техники -->
            <td>
                <span class="model-display">${item.model || '—'}</span>
                <select class="model-select" style="display: ${isEditable ? 'block' : 'none'};">
                    <option value="">Выберите модель техники</option>
                    ${item.modelOptions?.map(option => `
                        <option value="${option}" ${item.model === option ? 'selected' : ''}>${option}</option>
                    `).join('')}
                </select>
                <button class="details-button" data-name="Модель техники" data-value="${item.model || '—'}">Подробнее</button>
            </td>

            <!-- Зав. № машины -->
            <td contenteditable="${isEditable}">${item.serial_number || '—'}</td>

            <!-- Модель двигателя -->
            <td>
                <span class="engine-model-display">${item.engine_model || '—'}</span>
                <select class="engine-model-select" style="display: ${isEditable ? 'block' : 'none'};">
                    <option value="">Выберите модель двигателя</option>
                    ${item.engineModelOptions?.map(option => `
                        <option value="${option}" ${item.engine_model === option ? 'selected' : ''}>${option}</option>
                    `).join('')}
                </select>
                <button class="details-button" data-name="Модель двигателя" data-value="${item.engine_model || '—'}">Подробнее</button>
            </td>

            <!-- Зав. № двигателя -->
            <td contenteditable="${isEditable}">${item.engine_serial || '—'}</td>

            <!-- Модель трансмиссии -->
            <td>
                <span class="transmission-model-display">${item.transmission_model || '—'}</span>
                <select class="transmission-model-select" style="display: ${isEditable ? 'block' : 'none'};">
                    <option value="">Выберите модель трансмиссии</option>
                    ${item.transmissionModelOptions?.map(option => `
                        <option value="${option}" ${item.transmission_model === option ? 'selected' : ''}>${option}</option>
                    `).join('')}
                </select>
                <button class="details-button" data-name="Модель трансмиссии" data-value="${item.transmission_model || '—'}">Подробнее</button>
            </td>

            <!-- Зав. № трансмиссии -->
            <td contenteditable="${isEditable}">${item.transmission_serial || '—'}</td>

            <!-- Модель ведущего моста -->
            <td>
                <span class="drive-axle-model-display">${item.drive_axle_model || '—'}</span>
                <select class="drive-axle-model-select" style="display: ${isEditable ? 'block' : 'none'};">
                    <option value="">Выберите модель ведущего моста</option>
                    ${item.DriveAxleModelOptions?.map(option => `
                        <option value="${option}" ${item.drive_axle_model === option ? 'selected' : ''}>${option}</option>
                    `).join('')}
                </select>
                <button class="details-button" data-name="Модель ведущего моста" data-value="${item.drive_axle_model || '—'}">Подробнее</button>
            </td>

            <!-- Зав. № ведущего моста -->
            <td contenteditable="${isEditable}">${item.drive_axle_serial || '—'}</td>

            <!-- Модель управляемого моста -->
            <td>
                <span class="steer-axle-model-display">${item.steer_axle_model || '—'}</span>
                <select class="steer-axle-model-select" style="display: ${isEditable ? 'block' : 'none'};">
                    <option value="">Выберите модель управляемого моста</option>
                    ${item.SteerAxleModelOptions?.map(option => `
                        <option value="${option}" ${item.steer_axle_model === option ? 'selected' : ''}>${option}</option>
                    `).join('')}
                </select>
                <button class="details-button" data-name="Модель управляемого моста" data-value="${item.steer_axle_model || '—'}">Подробнее</button>
            </td>

            <td contenteditable="${isEditable}">${item.steer_axle_serial || '—'}</td>

            <!-- Дата отгрузки с завода -->
            <td>
                <span class="shipment-date-display">${item.shipment_date ? new Date(item.shipment_date).toLocaleDateString() : '—'}</span>
                <input type="date" class="shipment-date-input" value="${formatDate(item.shipment_date)}" style="display: ${isEditable ? 'block' : 'none'};">
            </td>

            <!-- Кнопка "Подробнее" для клиента -->
            <td>
                <span class="client-display">${item.client || '—'}</span>
                <select class="client-select" style="display: ${isEditable ? 'block' : 'none'};">
                    <option value="">Выберите клиента</option>
                    ${item.clientOptions?.filter(option => option.groups.includes('client')).map(option => `
                        <option value="${option.id}" ${item.client === option.first_name ? 'selected' : ''}>${option.first_name}</option>
                    `).join('')}
                </select>
                <button class="user-details-button" data-user-id="${item.clientId || ''}" data-user-name="${item.client || ''}">Подробнее</button>
            </td>

            <!-- Грузополучатель -->
            <td contenteditable="${isEditable}">${item.consignee  || '—'}</td>

            <!-- Адрес поставки -->
            <td contenteditable="${isEditable}">${item.delivery_address  || '—'}</td>

            <!-- Комплектация -->
            <td contenteditable="${isEditable}">${item.configuration || '—'}</td>

            <!-- Кнопка "Подробнее" для сервисной компании -->
            <td>
                <span class="service-company-display">${item.service_company || '—'}</span>
                <select class="service-company-select" style="display: ${isEditable ? 'block' : 'none'};">
                    <option value="">Выберите сервисную компанию</option>
                    ${item.serviceCompanyOptions?.filter(option => option.groups.includes('service_company')).map(option => `
                        <option value="${option.id}" ${item.service_company === option.first_name ? 'selected' : ''}>${option.first_name}</option>
                    `).join('')}
                </select>
                <button class="user-details-button" data-user-id="${item.service_companyId || ''}" data-user-name="${item.service_company || ''}">Подробнее</button>
            </td>

            <!-- Действия (изменить/сохранить/удалить) -->
            ${hasActionAccess ? `<td>${actionsHTML}</td>` : ''}
        </tr>
    `;
    return row;
}




// Функция для инициализации событий с делегированием
function initializeRowEventListenersMachine() {
    const machineResultDiv = document.getElementById('machine-result');

    if (machineResultDiv) {
        machineResultDiv.addEventListener('click', function(event) {
            if (event.target.classList.contains('edit-row-machine-button')) {
                toggleEditModeMachine(event);
            } else if (event.target.classList.contains('save-row-machine-button')) {
                saveRowDataMachine(event);
            } else if (event.target.classList.contains('delete-row-machine-button')) {
                deleteRowMachine(event);
            } else if (event.target.id === 'add-row-machine-button') {
                addNewRowMachine(event);
            } else if (event.target.classList.contains('details-button')) {
                const value = event.target.getAttribute('data-value');
                const name = event.target.getAttribute('data-name');
                fetchDataForDetails(name, value);
            } else if (event.target.classList.contains('user-details-button')) {
                const userId = event.target.getAttribute('data-user-id');
            }
        });
    }
}


function toggleEditModeMachine(event) {
    const row = event.target.closest('tr');
    const isEditing = event.target.classList.contains('edit-row-machine-button');

    // Переключение кнопок
    row.querySelector('.edit-row-machine-button').style.display = isEditing ? 'none' : 'inline-block';
    row.querySelector('.save-row-machine-button').style.display = isEditing ? 'inline-block' : 'none';
    row.querySelectorAll('[contenteditable]').forEach(cell => cell.contentEditable = isEditing);

    // Переключение редактируемости и видимости для отображаемых элементов
    row.querySelectorAll('.model-display, .engine-model-display, .transmission-model-display, .drive-axle-model-display, .steer-axle-model-display, .client-display, .service-company-display').forEach(display => {
        display.style.display = isEditing ? 'none' : 'inline-block';
    });

    row.querySelectorAll('.model-select, .engine-model-select, .transmission-model-select, .drive-axle-model-select, .steer-axle-model-select, .client-select, .service-company-select').forEach(select => {
        select.style.display = isEditing ? 'inline-block' : 'none';
    });

    // Переключение видимости для даты отгрузки
    row.querySelectorAll('.shipment-date-display').forEach(display => {
        display.style.display = isEditing ? 'none' : 'inline-block';
    });
    row.querySelectorAll('.shipment-date-input').forEach(input => {
        input.style.display = isEditing ? 'block' : 'none';
    });

    // Предустановка значений выпадающих списков при редактировании
    row.querySelectorAll('.model-select, .engine-model-select, .transmission-model-select, .drive-axle-model-select, .steer-axle-model-select, .client-select, .service-company-select').forEach(select => {
        const span = select.previousElementSibling; // Получаем элемент <span> перед <select>
        if (span && isEditing) {
            const spanText = span.textContent.trim() === '—' ? '' : span.textContent.trim();

            let selectedValue = ''; // Значение по умолчанию

            // Очистка текста от символов, которые могут помешать сравнению
            const cleanText = (text) => text.replace(/[^a-zA-Z0-9а-яА-ЯёЁ\s]/g, '').trim();

            // Приведение текста из span и option к чистому виду
            const cleanSpanText = cleanText(spanText);
            const option = Array.from(select.options).find(opt => cleanText(opt.textContent.trim()) === cleanSpanText);

            if (option) {
                selectedValue = option.value; // Установка значения из найденной <option>
            }

            select.value = selectedValue; // Установка значения в <select>
        }
    });
}


function addNewRowMachine(event) {
    const table = document.getElementById('machine-table').querySelector('tbody');
    const index = table.rows.length;

    const firstRow = table.querySelector('tr');

    // Проверяем доступ пользователя к действиям
    const userGroups = JSON.parse(document.getElementById('user-groups-data').textContent);
    const hasActionAccess = userGroups.includes('manager');

    // Добавляем строку
    table.insertAdjacentHTML('beforeend', createRowMachine({ serial_number: '—' }, index, true, hasActionAccess));

    const newRow = table.lastElementChild;

    // Показываем выпадающие списки для новых строк
    newRow.querySelectorAll('.model-select, .engine-model-select, .transmission-model-select, .drive-axle-model-select, .steer-axle-model-select, .client-select, .service-company-select').forEach(select => {
        select.style.display = 'inline-block';
    });

    // Инициализируем выпадающие списки для новой строки
    loadReferenceData();
    loadUserReferenceData();
}


// Сохранение данных строки
function saveRowDataMachine(event) {
    const row = event.target.closest('tr');
    const recordId = row.dataset.id; // Получаем идентификатор строки, если он существует


    // Функция для преобразования даты в формат API
    const formatDateForAPI = (inputElement) => {
        if (!inputElement) return null;
        const dateValue = inputElement.value;
        return dateValue || null;
    };

    const shipmentDateInput = row.querySelector('.shipment-date-input');

    const data = {
        model: row.querySelector('.model-select').value || null,
        serial_number: row.cells[2].textContent.trim() || null,
        engine_model: row.querySelector('.engine-model-select').value || null,
        engine_serial: row.cells[4].textContent.trim() || null,
        transmission_model: row.querySelector('.transmission-model-select').value || null,
        transmission_serial: row.cells[6].textContent.trim() || null,
        drive_axle_model: row.querySelector('.drive-axle-model-select').value || null,
        drive_axle_serial: row.cells[8].textContent.trim() || null,
        steer_axle_model: row.querySelector('.steer-axle-model-select').value || null,
        steer_axle_serial: row.cells[10].textContent.trim() || null,
        shipment_date: formatDateForAPI(shipmentDateInput),
        // Получаем first_name для клиента и сервисной компании
        client: row.querySelector('.client-select').selectedOptions[0]?.textContent || null,
        consignee: row.cells[13].textContent.trim() || null,
        delivery_address: row.cells[14].textContent.trim() || null,
        configuration: row.cells[15].textContent.trim() || null,
        service_company: row.querySelector('.service-company-select').selectedOptions[0]?.textContent || null,
    };

    //console.log('Post Запрос:', data);

    const method = recordId ? 'PUT' : 'POST'; // Если есть ID, обновляем; иначе создаем
    const url = recordId ? `/api/machines/${recordId}/` : '/api/machines/';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify(data),
    })
        .then(response => {
            //console.log('Статус ответа:', response.status);
            if (response.ok) {
                alert(recordId ? 'Данные успешно обновлены' : 'Новая запись успешно создана');

                // Обновляем отображение выбранных значений в выпадающих списках
                row.querySelector('.model-select').value = data.model || '';
                row.querySelector('.engine-model-select').value = data.engine_model || '';
                row.querySelector('.transmission-model-select').value = data.transmission_model || '';
                row.querySelector('.drive-axle-model-select').value = data.drive_axle_model || '';
                row.querySelector('.steer-axle-model-select').value = data.steer_axle_model || '';
                row.querySelector('.client-select').value = data.client || '';
                row.querySelector('.service-company-select').value = data.service_company || '';

                // Обновляем отображение в таблице
                row.querySelector('.model-display').textContent = data.model || '—';
                row.querySelector('.engine-model-display').textContent = data.engine_model || '—';
                row.querySelector('.transmission-model-display').textContent = data.transmission_model || '—';
                row.querySelector('.drive-axle-model-display').textContent = data.drive_axle_model || '—';
                row.querySelector('.steer-axle-model-display').textContent = data.steer_axle_model || '—';
                row.querySelector('.shipment-date-display').textContent = data.shipment_date
                    ? new Date(data.shipment_date).toLocaleDateString()
                    : '—';

                // Скрываем режим редактирования
                row.querySelectorAll('.save-row-machine-button').forEach(button => button.style.display = 'none');
                row.querySelectorAll('.edit-row-machine-button').forEach(button => button.style.display = 'inline-block');
                row.querySelectorAll('.model-select, .engine-model-select, .transmission-model-select, .drive-axle-model-select, .steer-axle-model-select, .client-select, .service-company-select').forEach(select => {
                    const span = select.previousElementSibling;
                    const selectedOption = select.options[select.selectedIndex];
                    if (span && selectedOption) {
                        span.textContent = selectedOption.textContent; // Отображаем текст выбранного значения
                        span.style.display = 'inline-block'; // Показываем текстовое значение
                    }

                    select.style.display = 'none'; // Скрываем выпадающий список
                });

                row.querySelectorAll('.model-display, .engine-model-display, .transmission-model-display, .drive-axle-model-display, .steer-axle-model-display, .shipment-date-display, .client-display, .service-company-display').forEach(display => display.style.display = 'inline-block');
                row.querySelectorAll('input[type="date"]').forEach(input => {
                    input.style.display = 'none';
                    const span = input.previousElementSibling;
                    if (span) {
                        span.textContent = new Date(input.value).toLocaleDateString();
                        span.style.display = 'inline-block';
                    }
                });
            } else {
                response.json().then(errorData => {
                    console.error('Ошибка сервера:', errorData);
                    alert('Ошибка сохранения данных: ' + JSON.stringify(errorData));
                });
            }
        })
        .catch(error => console.error('Ошибка запроса:', error));
}

// Удаление строки
function deleteRowMachine(event) {
    const row = event.target.closest('tr');
    const recordId = row.dataset.id; // Получаем идентификатор строки
    const serialNumber = row.querySelector('.serial-number')?.textContent || ''; // Получаем серийный номер из строки таблицы

    console.log('Удаление:', recordId, serialNumber);

    if (!recordId) {
        row.remove();
        return;
    }

    if (confirm('Вы уверены, что хотите удалить эту запись и все связанные данные?')) {
        // Отправляем запрос на удаление машины
        fetch(`/api/machines/${recordId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Не удалось удалить машину');
                }
                alert(`Машина с серийным номером ${serialNumber} и связанные данные успешно удалены.`);
                row.remove(); // Удаляем строку из таблицы на клиенте
            })
            .catch(error => {
                console.error('Ошибка при удалении:', error);
                alert('Произошла ошибка при удалении записи');
            });
    }
}



function addUserDetailsButtons() {
    const buttons = document.querySelectorAll('.user-details-button');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = e.target.getAttribute('data-user-id');
            const userName = e.target.getAttribute('data-user-name');
            const userDescription = e.target.getAttribute('data-user-description');
            showUserDetailsModal(userId, userName, userDescription);
        });
    });
}

function showUserDetailsModal(userId, userName, userDescription) {
    let modal = document.getElementById('user-details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'user-details-modal';
        modal.classList.add('modal');
        modal.style.display = 'none';
        document.body.appendChild(modal);

        const modalContent = document.createElement('div');
        modalContent.classList.add('modal-content');
        modal.appendChild(modalContent);

        const closeButton = document.createElement('span');
        closeButton.id = 'close-modal';
        closeButton.classList.add('close');
        closeButton.textContent = '×';
        modalContent.appendChild(closeButton);

        const detailsTable = document.createElement('div');
        detailsTable.id = 'user-details-table';
        modalContent.appendChild(detailsTable);

        closeButton.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }

    let detailsHTML = '<table border="1"><thead><tr>';
    const headers = ["Имя", "Описание"];
    headers.forEach(header => detailsHTML += `<th>${header}</th>`);
    detailsHTML += '</tr></thead><tbody>';

    // Используем textContent для безопасной вставки значений
    const nameCell = document.createElement('td');
    nameCell.textContent = userName || '—';  // Подставляем — если userName пустое

    const descriptionCell = document.createElement('td');
    descriptionCell.textContent = userDescription || '—';  // Подставляем — если userDescription пустое

    const row = document.createElement('tr');
    row.appendChild(nameCell);
    row.appendChild(descriptionCell);

    detailsHTML += row.outerHTML;  // Преобразуем строку <tr> в HTML

    detailsHTML += '</tbody></table>';
    document.getElementById('user-details-table').innerHTML = detailsHTML;
    modal.style.display = 'block';
}





function disableFutureDates() {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.setAttribute('max', today); // Set the max attribute
    });
}


// Функция для инициализации событий с делегированием
function initializeRowEventListeners(serialNumber) {
    const maintenanceResultDiv = document.getElementById('maintenance-result');

    if (maintenanceResultDiv) {
        // Делегирование событий: слушаем клики на родительский элемент
        maintenanceResultDiv.addEventListener('click', function(event) {
            if (event.target.classList.contains('edit-row-button')) {
                toggleEditMode(event);
            } else if (event.target.classList.contains('save-row-button')) {
                saveRowData(event);
            } else if (event.target.classList.contains('delete-row-button')) {
                deleteRow(event);
            } else if (event.target.id === 'add-row-button') {
                addNewRow(serialNumber);
            } else if (event.target.classList.contains('details-button')) {
                const value = event.target.getAttribute('data-value');
                const name = event.target.getAttribute('data-name');
                fetchDataForDetails(name, value);
            }
        });
    }
}





// Заполняем вкладку обслуживания
function populateMaintenanceTab(data, serialNumber) {

    const resultDiv = document.getElementById('maintenance-result');
    if (!resultDiv) {
        console.error('Элемент #maintenance-result не найден');
        return;
    }

    // Проверяем, имеет ли пользователь доступ к действиям
    const userGroups = JSON.parse(document.getElementById('user-groups-data').textContent);
    const hasActionAccess = userGroups.includes('client') || userGroups.includes('manager') || userGroups.includes('service_company');


    let resultHTML = '<table id="maintenance-table" border="1"><thead><tr>';
    const headers = [
        "Зав. № машины", "Вид ТО", "Дата проведения ТО",
        "Наработка, м/час", "№ заказ-наряда", "Дата заказ-наряда",
        "Организация, проводившая ТО"
    ];
    // Добавляем заголовок "Действия" только если есть доступ
    if (hasActionAccess) {
        headers.push("Действия");
    }

    headers.forEach(header => resultHTML += `<th>${header}</th>`);
    resultHTML += '</tr></thead><tbody>';

    data.forEach((item, index) => {
        resultHTML += createTableRow(item, index, false, hasActionAccess, serialNumber);
    });

    resultHTML += '</tbody></table>';

    // Добавляем кнопку "Добавить строку" только если есть доступ
    if (hasActionAccess) {
        resultHTML += '<button id="add-row-button">Добавить строку</button>';
    }

    resultDiv.innerHTML = resultHTML;

    disableFutureDates(); // Prevent future dates
    loadReferenceData();


    // Инициализируем сортировку таблицы
    initializeDataTable('#maintenance-table', 2, 'desc');  //

       // Назначаем обработчики событий с делегированием
    initializeRowEventListeners(serialNumber);
}

// Создание строки таблицы
function createTableRow(item, index, isEditable, hasActionAccess) {

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return !isNaN(date) ? date.toISOString().split('T')[0] : ''; // Format for <input type="date">
    };

    const row = `
        <tr data-id="${item.recordId || ''}" data-index="${index}">

            <td>${item.serial_number || '—'}</td>

            <td>
                <span class="maintenance-type-display">${item.maintenance_type || '—'}</span>
                <select class="maintenance-type-select" style="display:none;">
                    <option value="">Выберите вид ТО</option>
                    ${item.maintenanceOptions?.map(option => `
                        <option value="${option}" ${item.maintenance_type === option ? 'selected' : ''}>
                            ${option}
                        </option>
                    `).join('')}
                </select>
                <button class="details-button" data-name="Вид ТО" data-value="${item.maintenance_type || '—'}">Подробнее</button>
            </td>

            <td>
                <span class="date-display">${item.maintenance_date ? new Date(item.maintenance_date).toLocaleDateString() : '—'}</span>
                <input type="date" class="date-input maintenance-date-input" value="${formatDate(item.maintenance_date)}" style="display: ${isEditable ? 'block' : 'none'};">
            </td>

            <td contenteditable="${isEditable}">${item.operating_hours || '—'}</td>
            <td contenteditable="${isEditable}">${item.order_number || '—'}</td>

            <td>
                <span class="date-display">${item.order_date ? new Date(item.order_date).toLocaleDateString() : '—'}</span>
                <input type="date" class="date-input order-date-input" value="${formatDate(item.order_date)}" style="display: ${isEditable ? 'block' : 'none'};">
            </td>

            <td>
                <span class="organization-display">${item.organization || '—'}</span>
                <select class="organization-select" style="display:none;">
                    <option value="">Выберите организацию</option>
                    ${item.organizationOptions?.map(option => `
                        <option value="${option}" ${item.organization === option ? 'selected' : ''}>
                            ${option}
                        </option>
                    `).join('')}
                </select>
                <button class="details-button" data-name="Организация" data-value="${item.organization || '—'}">Подробнее</button>
            </td>
            <td>
                <button class="edit-row-button" ${isEditable ? 'style="display:none;"' : ''}>Изменить</button>
                <button class="save-row-button" ${isEditable ? '' : 'style="display:none;"'}>Сохранить</button>
                <button class="delete-row-button">Удалить</button>
            </td>
        </tr>
    `;
    return row;
}




// Переключение режима редактирования строки
function toggleEditMode(event) {
    const row = event.target.closest('tr');
    const isEditing = event.target.classList.contains('edit-row-button');

    row.querySelectorAll('.edit-row-button').forEach(button => button.style.display = isEditing ? 'none' : 'inline-block');
    row.querySelectorAll('.save-row-button').forEach(button => button.style.display = isEditing ? 'inline-block' : 'none');
    row.querySelectorAll('[contenteditable]').forEach(cell => cell.contentEditable = isEditing);

    row.querySelectorAll('.date-display').forEach(display => {
        display.style.display = isEditing ? 'none' : 'inline-block';
    });

    row.querySelectorAll('.date-input').forEach(input => {
        input.style.display = isEditing ? 'block' : 'none';
    });

    row.querySelectorAll('.maintenance-type-display, .organization-display').forEach(display => display.style.display = isEditing ? 'none' : 'inline-block');
    row.querySelectorAll('.maintenance-type-select, .organization-select').forEach(select => {
        select.style.display = isEditing ? 'inline-block' : 'none';
    });

    // Preselect dropdown value on edit
    row.querySelectorAll('.maintenance-type-select, .organization-select').forEach(select => {
        const span = select.previousElementSibling;
        if (span && isEditing) {
            select.value = span.textContent.trim() === '—' ? '' : span.textContent.trim();
        }
    });
}


function saveRowData(event) {
    const row = event.target.closest('tr');
    const recordId = row.dataset.id; // Получаем идентификатор строки, если он существует

    // Функция для преобразования даты
    const formatDateForAPI = (inputElement) => {
        if (!inputElement) return null;
        const dateValue = inputElement.value;
        return dateValue || null;
    };

    const maintenanceDateInput = row.querySelector('.maintenance-date-input');
    const orderDateInput = row.querySelector('.order-date-input');

    // Извлекаем значение operating_hours из поля contenteditable
    const operatingHours = parseInt(row.querySelector('[contenteditable]').textContent.trim()) || null;

    const data = {
        serial_number: row.cells[0].textContent.trim(),  // Заводской номер сохраняем
        maintenance_type: row.querySelector('.maintenance-type-select').value || null,
        maintenance_date: formatDateForAPI(maintenanceDateInput),
        operating_hours: operatingHours,  // Сохраняем значение operating_hours
        order_number: row.cells[4].textContent.trim(),
        order_date: formatDateForAPI(orderDateInput),
        organization: row.querySelector('.organization-select').value || null,
    };

    const method = recordId ? 'PUT' : 'POST'; // Если есть ID, обновляем; иначе создаем
    const url = recordId ? `/api/maintenances/${recordId}/` : '/api/maintenances/';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify(data),
    })
        .then(response => {
            //console.log('Статус ответа:', response.status);
            if (response.ok) {
                alert(recordId ? 'Данные успешно обновлены' : 'Новая запись успешно создана');

                // Обновляем отображение выбранных значений в выпадающих списках
                row.querySelector('.maintenance-type-select').value = data.maintenance_type || '';
                row.querySelector('.organization-select').value = data.organization || '';

                // Обновляем отображение в таблице
                row.querySelector('.maintenance-type-display').textContent = data.maintenance_type || '—';
                row.querySelector('.organization-display').textContent = data.organization || '—';

                // Скрываем режим редактирования
                row.querySelectorAll('.save-row-button').forEach(button => button.style.display = 'none');
                row.querySelectorAll('.edit-row-button').forEach(button => button.style.display = 'inline-block');
                row.querySelectorAll('[contenteditable]').forEach(cell => cell.contentEditable = 'false');
                row.querySelectorAll('input[type="date"]').forEach(input => {
                    input.style.display = 'none';
                    const span = input.previousElementSibling;
                    if (span) {
                        span.textContent = new Date(input.value).toLocaleDateString();
                        span.style.display = 'inline-block';
                    }
                });
                row.querySelectorAll('.maintenance-type-select, .organization-select').forEach(select => select.style.display = 'none');
                row.querySelectorAll('.maintenance-type-display, .organization-display').forEach(display => display.style.display = 'inline-block');
            } else {
                response.json().then(errorData => {
                    console.error('Ошибка сервера:', errorData);
                    alert('Ошибка сохранения данных: ' + JSON.stringify(errorData));
                });
            }
        })
        .catch(error => console.error('Ошибка запроса:', error));
}

// Удаление строки
function deleteRow(event) {
    const row = event.target.closest('tr');
    const recordId = row.dataset.id; // Получаем идентификатор строки

    if (!recordId) {
        row.remove(); // Если идентификатора нет, просто удаляем строку с интерфейса
        return;
    }

    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
        fetch(`/api/maintenances/${recordId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            },
        })
            .then(response => {
                if (response.ok) {
                    alert('Запись успешно удалена');
                    row.remove(); // Удаляем строку из интерфейса
                } else {
                    console.error('Ошибка удаления записи:', response.statusText);
                    alert('Не удалось удалить запись');
                }
            })
            .catch(error => console.error('Ошибка запроса при удалении:', error));
    }
}

// Добавление новой строки
function addNewRow(serialNumber) {
    const table = document.getElementById('maintenance-table').querySelector('tbody');
    const index = table.rows.length;

    // Получаем serial_number из первой строки
    const firstRow = table.querySelector('tr');

    // Добавляем строку
    table.insertAdjacentHTML('beforeend', createTableRow({ serial_number: serialNumber }, index, true));

    const newRow = table.lastElementChild;

    // Показываем выпадающие списки для новых строк
    newRow.querySelectorAll('.maintenance-type-select, .organization-select').forEach(select => {
        select.style.display = 'inline-block';
    });

    // Инициализируем выпадающие списки для новой строки
    loadReferenceData();
}

// Получение CSRF токена
function getCSRFToken() {
    const cookies = document.cookie.split(';');
    return cookies.find(cookie => cookie.trim().startsWith('csrftoken='))?.split('=')[1] || '';
}


// Функция для инициализации событий с делегированием
function initializeRowEventListenersClaim(serialNumber) {
    const claimResultDiv = document.getElementById('claims-result');

    if (claimResultDiv) {
        // Удаляем старый обработчик перед добавлением нового
        //claimResultDiv.replaceWith(claimResultDiv.cloneNode(true));

        claimResultDiv.addEventListener('click', function(event) {
            if (event.target.classList.contains('edit-row-claim-button')) {
                toggleEditModeClaim(event);
            } else if (event.target.classList.contains('save-row-claim-button')) {
                saveRowDataClaim(event);
            } else if (event.target.classList.contains('delete-row-claim-button')) {
                deleteRowClaim(event);
            } else if (event.target.id === 'add-row-claim-button') {
                addNewRowClaim(serialNumber);
            } else if (event.target.classList.contains('details-claim-button')) {
                const value = event.target.getAttribute('data-value');
                const name = event.target.getAttribute('data-name');
                fetchDataForDetails(name, value);
            }
        });
    }
}




function populateClaimsTab(data, serialNumber) {
    const resultDiv = document.getElementById('claims-result');
    if (!resultDiv) {
        console.error('Элемент #claims-result не найден');
        return;
    }

    // Проверяем, имеет ли пользователь доступ к действиям
    const userGroups = JSON.parse(document.getElementById('user-groups-data').textContent);
    const hasActionAccess = userGroups.includes('manager') || userGroups.includes('service_company');


    let resultHTML = '<table id="claim-table" border="1"><thead><tr>';
    const headers = [
        "Зав. № машины", "Дата отказа", "Наработка, м/час",
        "Узел отказа", "Описание отказа", "Способ восстановления",
        "Используемые запасные части", "Дата восстановления", "Время простоя техники"
    ];

    // Добавляем заголовок "Действия" только если есть доступ
    if (hasActionAccess) {
        headers.push("Действия");
    }

    headers.forEach(header => resultHTML += `<th>${header}</th>`);
    resultHTML += '</tr></thead><tbody>';

    data.forEach((item, index) => {
        resultHTML += createRowClaim(item, index, false, hasActionAccess, serialNumber);
    });

    resultHTML += '</tbody></table>';

    // Добавляем кнопку "Добавить строку" только если есть доступ
    if (hasActionAccess) {
        resultHTML += '<button id="add-row-claim-button">Добавить строку</button>';
    }

    resultDiv.innerHTML = resultHTML;

    initializeDataTable('#claim-table', 8, 'desc'); // Сортировка по "Дата отказа"
    initializeRowEventListenersClaim(serialNumber); // Инициализация обработчиков

    // Показываем кнопку для экспорта
    document.getElementById('export-excel-button').style.display = 'inline-block';
}

// Переключение режима редактирования строки
function toggleEditModeClaim(event) {
    const row = event.target.closest('tr');
    const isEditing = event.target.classList.contains('edit-row-claim-button');

    row.querySelectorAll('.edit-row-claim-button').forEach(button => button.style.display = isEditing ? 'none' : 'inline-block');
    row.querySelectorAll('.save-row-claim-button').forEach(button => button.style.display = isEditing ? 'inline-block' : 'none');
    row.querySelectorAll('[contenteditable]').forEach(cell => cell.contentEditable = isEditing);

    row.querySelectorAll('.date-display').forEach(display => {
        display.style.display = isEditing ? 'none' : 'inline-block';
    });

    row.querySelectorAll('.date-input').forEach(input => {
        input.style.display = isEditing ? 'block' : 'none';
    });

    row.querySelectorAll('.failed-node-display, .recovery-method-display').forEach(display => display.style.display = isEditing ? 'none' : 'inline-block');
    row.querySelectorAll('.failed-node-select, .recovery-method-select').forEach(select => select.style.display = isEditing ? 'inline-block' : 'none');


    // Preselect dropdown value on edit
    row.querySelectorAll('.failed-node-select, .recovery-method-select').forEach(select => {
        const span = select.previousElementSibling;
        if (span && isEditing) {
            select.value = span.textContent.trim() === '—' ? '' : span.textContent.trim();
        }
    });
}


function createRowClaim(item, index, isEditable, hasActionAccess) {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return !isNaN(date) ? date.toISOString().split('T')[0] : ''; // Формат для <input type="date">
    };

    let actionsHTML = '';
    if (hasActionAccess) {
        actionsHTML = `
            <button class="edit-row-claim-button" ${isEditable ? 'style="display:none;"' : ''}>Изменить</button>
            <button class="save-row-claim-button" ${isEditable ? '' : 'style="display:none;"'}>Сохранить</button>
            <button class="delete-row-claim-button">Удалить</button>
        `;
    }

    const row = `
        <tr data-id="${item.recordId || ''}" data-index="${index}">
            <td>${item.serial_number || '—'}</td>
            <td>
                <span class="date-display">${item.failure_date ? new Date(item.failure_date).toLocaleDateString() : '—'}</span>
                <input type="date" class="date-input failure-date-input" value="${formatDate(item.failure_date)}" style="display: ${isEditable ? 'block' : 'none'};">
            </td>
            <td contenteditable="${isEditable}">${item.operating_hours || '—'}</td>
            <td>
                <span class="failed-node-display">${item.failed_node || '—'}</span>
                <select class="failed-node-select" style="display:none;">
                    <option value="">Выберите узел отказа</option>
                </select>
                <button class="details-claim-button" data-name="Узел отказа" data-value="${item.failed_node || '—'}">Подробнее</button>
            </td>
            <td contenteditable="${isEditable}">${item.failure_description || '—'}</td>
            <td>
                <span class="recovery-method-display">${item.recovery_method || '—'}</span>
                <select class="recovery-method-select" style="display:none;">
                    <option value="">Выберите способ восстановления</option>
                    ${item.recovery_methodOptions?.map(option => `
                        <option value="${option}" ${item.recovery_method === option ? 'selected' : ''}>
                            ${option}
                        </option>
                    `).join('')}
                </select>
                <button class="details-claim-button" data-name="Способ восстановления" data-value="${item.recovery_method || '—'}">Подробнее</button>
            </td>
            <td contenteditable="${isEditable}">${item.spare_parts || '—'}</td>
            <td>
                <span class="date-display">${item.recovery_date ? new Date(item.recovery_date).toLocaleDateString() : '—'}</span>
                <input type="date" class="date-input recovery-date-input" value="${formatDate(item.recovery_date)}" style="display: ${isEditable ? 'block' : 'none'};">
            </td>
            <td contenteditable="${isEditable}">${item.downtime || '—'}</td>
            ${hasActionAccess ? `<td>${actionsHTML}</td>` : ''}
        </tr>
    `;
    return row;
}

function addNewRowClaim(serialNumber) {
    const table = document.getElementById('claim-table').querySelector('tbody');
    const index = table.rows.length;

    // Получаем serial_number из первой строки
    const firstRow = table.querySelector('tr');

    // Проверяем доступ пользователя к действиям
    const userGroups = JSON.parse(document.getElementById('user-groups-data').textContent);
    const hasActionAccess = userGroups.includes('manager') || userGroups.includes('service_company');

    // Добавляем строку
    table.insertAdjacentHTML('beforeend', createRowClaim({ serial_number: serialNumber }, index, true, hasActionAccess));

    const newRow = table.lastElementChild;

    // Показываем выпадающие списки для новых строк
    newRow.querySelectorAll('.failed-node-select, .recovery-method-select').forEach(select => {
        select.style.display = 'inline-block';
    });

    // Инициализируем выпадающие списки для новой строки
    loadReferenceData();
}



function saveRowDataClaim(event) {
    const button = event.target;
    button.disabled = true; // Блокируем кнопку

    const row = event.target.closest('tr');
    const recordId = row.dataset.id;

    // Функция для преобразования даты
    const formatDateForAPI = (inputElement) => {
        if (!inputElement) return null;
        const dateValue = inputElement.value;
        return dateValue || null;
    };

    const failureDateInput = row.querySelector('.failure-date-input');
    const recoveryDateInput = row.querySelector('.recovery-date-input');

    // Собираем данные из строки
    const data = {
        serial_number: row.cells[0].textContent.trim(),
        failure_date: formatDateForAPI(failureDateInput),  // Преобразуем дату отказа
        operating_hours: parseInt(row.cells[2].textContent.trim()) || 0,
        failed_node: row.querySelector('.failed-node-select')?.value || null,
        failure_description: row.cells[4].textContent.trim(),
        recovery_method: row.querySelector('.recovery-method-select')?.value || null,
        spare_parts: row.cells[6].textContent.trim(),
        recovery_date: formatDateForAPI(recoveryDateInput),  // Преобразуем дату восстановления
        downtime: row.cells[8].textContent.trim(),
    };

    const method = recordId ? 'PUT' : 'POST';
    const url = recordId ? `/api/claims/${recordId}/` : '/api/claims/';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify(data),
    })
        .then(response => {
            if (response.ok) {
                alert(recordId ? 'Данные успешно обновлены' : 'Новая запись успешно создана');

                // Переключаем на обычный режим (без редактирования)
                row.querySelectorAll('.save-row-claim-button').forEach(button => button.style.display = 'none');
                row.querySelectorAll('.edit-row-claim-button').forEach(button => button.style.display = 'inline-block');
                row.querySelectorAll('[contenteditable]').forEach(cell => cell.contentEditable = 'false');

                // Обновляем ячейки с датами
                row.querySelectorAll('input[type="date"]').forEach(input => {
                    input.style.display = 'none';
                    const span = input.previousElementSibling;
                    if (span) {
                        span.textContent = new Date(input.value).toLocaleDateString();
                        span.style.display = 'inline-block';
                    }
                });

                // Переключаем выпадающие списки на выбранные значения
                row.querySelectorAll('.failed-node-select, .recovery-method-select').forEach(select => {
                    const span = select.previousElementSibling;
                    const selectedOption = select.options[select.selectedIndex];
                    if (span && selectedOption) {
                        span.textContent = selectedOption.textContent; // Отображаем текст выбранного значения
                        span.style.display = 'inline-block'; // Показываем текстовое значение
                    }

                    select.style.display = 'none'; // Скрываем выпадающий список
                });

                // Также обновляем сами значения в выпадающих списках
                row.querySelector('.failed-node-select').value = data.failed_node || '';
                row.querySelector('.recovery-method-select').value = data.recovery_method || '';
            } else {
                return response.json().then(errorData => {
                    throw new Error(JSON.stringify(errorData));
                });
            }
        })
        .catch(error => console.error('Ошибка запроса:', error))
        .finally(() => {
            button.disabled = false;
        });
}

function deleteRowClaim(event) {
    const row = event.target.closest('tr');
    const recordId = row.dataset.id; // Получаем идентификатор строки

    if (!recordId) {
        row.remove(); // Если идентификатора нет, просто удаляем строку с интерфейса
        return;
    }

    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
        fetch(`/api/claims/${recordId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            },
        })
            .then(response => {
                if (response.ok) {
                    alert('Запись успешно удалена');
                    row.remove(); // Удаляем строку из интерфейса
                } else {
                    console.error('Ошибка удаления записи:', response.statusText);
                    alert('Не удалось удалить запись');
                }
            })
            .catch(error => console.error('Ошибка запроса при удалении:', error));
    }
}



function addDetailsButtons() {
    // Добавляем обработчик клика для кнопок "Подробнее"
    const buttons = document.querySelectorAll('.details-button');
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            const value = e.target.getAttribute('data-value'); // Получаем значение из data-value
            const name = e.target.getAttribute('data-name');   // Получаем название поля

            // Вызываем функцию для запроса, передавая значение из кнопки
            fetchDataForDetails(name, value);
        });
    });
}

function fetchDataForDetails(name, value) {
    const apiUrl = `/api/references/?name=${value}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Обработка полученных данных
            if (data && data.length > 0) {
                showDetailsModal(data);  // Отправляем данные в модальное окно
            } else {
                alert('Данные не найдены.');
            }
        })
        .catch(error => console.error('Ошибка при запросе данных:', error));
}

function showDetailsModal(data) {
    let modal = document.getElementById('details-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'details-modal';
        modal.classList.add('modal');
        modal.style.display = 'none'; // скрыто по умолчанию
        document.body.appendChild(modal);

        const modalContent = document.createElement('div');
        modalContent.classList.add('modal-content');
        modal.appendChild(modalContent);

        const closeButton = document.createElement('span');
        closeButton.id = 'close-modal';
        closeButton.classList.add('close');
        closeButton.textContent = '×';
        modalContent.appendChild(closeButton);

        const detailsTable = document.createElement('div');
        detailsTable.id = 'details-table';
        modalContent.appendChild(detailsTable);

        // Убедимся, что обработчик клика установлен после добавления в DOM
        closeButton.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }

    // Строим таблицу для отображения данных
    let detailsHTML = '<table border="1"><thead><tr>';
    const headers = ["Имя", "Сущность", "Описание"];
    headers.forEach(header => detailsHTML += `<th>${header}</th>`);
    detailsHTML += '</tr></thead><tbody>';

    data.forEach(item => {
        detailsHTML += `<tr><td>${item.name}</td><td>${item.entity_name}</td><td>${item.description}</td></tr>`;
    });

    detailsHTML += '</tbody></table>';
    document.getElementById('details-table').innerHTML = detailsHTML;

    // Показываем модальное окно
    modal.style.display = 'block';
}


// Функция для экспорта в Excel
function exportToExcel() {
    const url = "/api/table/export_excel/";  // Правильный URL для экспорта
    fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + getAuthToken(),  // Если используется авторизация
        }
    })
    .then(response => response.blob())  // Преобразуем ответ в blob
    .then(blob => {
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = 'data_export.xlsx';  // Название файла
        link.click();  // Имитируем клик для скачивания файла
        window.URL.revokeObjectURL(url);  // Очищаем URL-объект
    })
    .catch(error => {
        console.error('Ошибка при экспорте в Excel:', error);
    });
}


// Пример функции для получения токена авторизации (если используется)
function getAuthToken() {
    // Получение токена из хранилища или cookie
    return localStorage.getItem('auth_token') || '';
}
