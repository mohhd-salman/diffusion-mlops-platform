import uuid

def base36_encode(number):
    alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
    base36 = ''
    while number:
        number, i = divmod(number, 36)
        base36 = alphabet[i] + base36
    return base36


# Function to generate base36 IDs with a prefix (e.g., 'proj-', 'usr-')
def generate_base36_id(prefix, length=8):
    random_uuid = uuid.uuid4().int  # Generate a random UUID and convert it to an integer
    base36_id = base36_encode(random_uuid)

    # Return only the required length of the base36 string
    return f"{prefix}{base36_id[:length]}"