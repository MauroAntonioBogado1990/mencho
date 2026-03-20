class MenchoException(Exception):
    """Base para todas las excepciones de la app Mencho"""
    def __init__(self, message: str, code: int = 400):
        self.message = message
        self.code = code

class CaravanaDuplicadaException(MenchoException):
    def __init__(self, caravana: str):
        super().__init__(f"La caravana {caravana} ya existe en el sistema.", code=400)

class AnimalNoEncontradoException(MenchoException):
    def __init__(self):
        super().__init__("El animal solicitado no existe.", code=404)