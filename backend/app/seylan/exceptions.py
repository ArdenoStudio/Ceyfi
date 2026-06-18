class SeylanAPIError(Exception):
    def __init__(self, code: str, message: str = "", description: str = "", txn_ref: str = ""):
        super().__init__(f"Seylan error {code}: {message} — {description}")
        self.code = code
        self.message = message
        self.description = description
        self.txn_ref = txn_ref

class NotConfiguredError(Exception):
    pass