from app.core.redis import redis_client
from app.core.security import generate_otp, hash_otp, normalize_email

OTP_TTL_SECONDS = 600
OTP_REQUEST_LIMIT = 5
OTP_PREFIX = "otp:challenge"


def create_and_store_otp(email: str) -> str:
    normalized_email = normalize_email(email)
    request_key = f"otp:request-count:{normalized_email}"
    request_count = redis_client.incr(request_key)
    if request_count == 1:
        redis_client.expire(request_key, 3600)
    if request_count > OTP_REQUEST_LIMIT:
        raise ValueError("Too many OTP requests. Try again later.")

    otp = generate_otp()
    challenge_key = f"{OTP_PREFIX}:{normalized_email}"
    redis_client.setex(challenge_key, OTP_TTL_SECONDS, hash_otp(otp, normalized_email))
    redis_client.setex(f"{challenge_key}:attempts", OTP_TTL_SECONDS, "0")
    return otp


def verify_stored_otp(email: str, otp: str) -> bool:
    normalized_email = normalize_email(email)
    challenge_key = f"{OTP_PREFIX}:{normalized_email}"
    expected_hash = redis_client.get(challenge_key)
    if not expected_hash:
        return False

    attempts_key = f"{challenge_key}:attempts"
    attempts = redis_client.incr(attempts_key)
    if attempts > 5:
        clear_stored_otp(normalized_email)
        return False

    return expected_hash == hash_otp(otp, normalized_email)


def clear_stored_otp(email: str) -> None:
    normalized_email = normalize_email(email)
    challenge_key = f"{OTP_PREFIX}:{normalized_email}"
    redis_client.delete(challenge_key)
    redis_client.delete(f"{challenge_key}:attempts")