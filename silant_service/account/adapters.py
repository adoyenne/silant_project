from allauth.account.adapter import DefaultAccountAdapter

class CustomAccountAdapter(DefaultAccountAdapter):
    def is_open_for_signup(self, request):
        """
        Запрещает регистрацию новых пользователей через сайт.
        Только администратор может создавать пользователей.
        """
        return False