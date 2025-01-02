document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form");
    const errorMessage = document.getElementById("error-message");
    const usernameField = document.getElementById("username");
    const passwordField = document.getElementById("password");

    form.addEventListener("submit", (event) => {
        event.preventDefault(); // Останавливаем стандартное поведение формы

        // Очищаем предыдущие ошибки
        resetErrorStyles();

        const formData = new FormData(form);

        fetch(form.action, {
            method: "POST",
            body: formData,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        })
        .then((response) => {
            if (response.ok) {
                // Если авторизация успешна, перенаправляем на главную страницу
                window.location.href = "/";
            } else {
                // Обрабатываем 400-ошибку (Bad Request)
                return response.json().then((data) => {
                    if (data && data.error) {
                        throw new Error(data.error); // Передаём ошибку в catch
                    }
                    throw new Error("Произошла ошибка при авторизации.");
                });
            }
        })
        .catch((error) => {
            // Отображаем ошибку в интерфейсе
            showError(error.message);
        });
    });

    // Функция для отображения ошибки
    function showError(message) {
        errorMessage.textContent = message;
        usernameField.style.borderColor = "red";
        passwordField.style.borderColor = "red";
    }

    // Функция для сброса ошибок и стилей
    function resetErrorStyles() {
        usernameField.style.borderColor = "";
        passwordField.style.borderColor = "";
        errorMessage.textContent = "";
    }
});