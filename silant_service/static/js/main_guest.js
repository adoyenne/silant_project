document.addEventListener("DOMContentLoaded", () => {
    const searchButton = document.getElementById("search-button");
    searchButton.addEventListener("click", searchMachineForGuest);
});

// Функция поиска для неавторизованных пользователей
function searchMachineForGuest() {
    const serialInput = document.getElementById("serial");
    const serialNumber = serialInput.value.trim();

    if (!serialNumber) {
        showError("Введите заводской номер!");
        return;
    }

    // Сделаем запрос к API для получения данных о машине по серийному номеру
    fetch(`/api/machines/?serial_number=${serialNumber}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.length === 0) {
                showError("Машина с таким номером не найдена.");
                clearPreviousResults();  // Очищаем предыдущие результаты
            } else {
                resetError();
                clearPreviousResults();  // Очищаем предыдущие результаты
                showGuestTable(data.slice(0, 10)); // Ограничиваем вывод 10 строками
            }
        })
        .catch(() => {
            showError("Ошибка загрузки данных.");
        });
}

// Функция для отображения таблицы для неавторизованных пользователей
function showGuestTable(data) {
    const resultDiv = document.getElementById("guest-machine-result");
    resultDiv.style.display = "block";  // Показываем блок с результатами

    let resultHTML = '<h3>Общая информация:</h3>';

    // Обертываем таблицу в контейнер для прокрутки
    resultHTML += '<div class="table-container"><table border="1"><thead><tr>';
    const headers = ["№ п/п", "Модель техники", "Зав. № машины", "Модель двигателя", "Зав. № двигателя",
        "Модель трансмиссии (производитель, артикул)", "Зав. № трансмиссии", "Модель ведущего моста",
        "Зав. № ведущего моста", "Модель управляемого моста", "Зав. № управляемого моста"];
    headers.forEach(header => resultHTML += `<th>${header}</th>`);
    resultHTML += "</tr></thead><tbody>";

    data.forEach((machine, index) => {
        resultHTML += `<tr data-machine-id="${machine.id}">`;
        resultHTML += `<td>${index + 1}</td>`;
        resultHTML += `<td>${machine.model || '—'}</td>`;
        resultHTML += `<td>${machine.serial_number || '—'}</td>`;
        resultHTML += `<td>${machine.engine_model || '—'}</td>`;
        resultHTML += `<td>${machine.engine_serial || '—'}</td>`;
        resultHTML += `<td>${machine.transmission_model || '—'}</td>`;
        resultHTML += `<td>${machine.transmission_serial || '—'}</td>`;
        resultHTML += `<td>${machine.drive_axle_model || '—'}</td>`;
        resultHTML += `<td>${machine.drive_axle_serial || '—'}</td>`;
        resultHTML += `<td>${machine.steer_axle_model || '—'}</td>`;
        resultHTML += `<td>${machine.steer_axle_serial || '—'}</td>`;
        resultHTML += '</tr>';
    });

    resultHTML += "</tbody></table></div>"; // Закрываем контейнер таблицы
    resultDiv.innerHTML = resultHTML;  // Вставляем результат в блок
}

// Функция для отображения ошибки
function showError(message) {
    const serialInputField = document.getElementById("serial"); // Ваше поле ввода для серийного номера
    // Показываем ошибку в поле ввода
    serialInputField.style.borderColor = "red";  // Красная рамка у поля
    serialInputField.style.backgroundColor = "#ffdddd"; // Красный фон поля ввода
    const errorDiv = document.getElementById("error-text");
    errorDiv.textContent = message;  // Устанавливаем текст ошибки
    errorDiv.style.display = "block";  // Показываем блок с ошибкой
}

// Функция для сброса ошибки
function resetError() {
    const serialInputField = document.getElementById("serial");
    serialInputField.style.borderColor = "";  // Сбросить цвет рамки
    serialInputField.style.backgroundColor = ""; // Сбросить цвет фона

    const errorDiv = document.getElementById("error-text");
    errorDiv.style.display = "none";  // Прячем блок с ошибкой
}

// Функция для очистки предыдущих результатов
function clearPreviousResults() {
    const resultDiv = document.getElementById("guest-machine-result");
    resultDiv.innerHTML = '';  // Очищаем блок с результатами
}