import threading
import time

MAX_FAILURES = 8
WINDOW_SECONDS = 600


class LoginLimiter:
    """Slows password guessing per account. Lives in memory, so it suits a single
    server process and resets on restart. Use Redis if the API ever scales out."""

    def __init__(self):
        self._failures = {}
        self._lock = threading.Lock()

    def _recent(self, key):
        cutoff = time.monotonic() - WINDOW_SECONDS
        recent = [moment for moment in self._failures.get(key, []) if moment > cutoff]

        if recent:
            self._failures[key] = recent
        else:
            self._failures.pop(key, None)

        return recent

    def is_locked(self, key):
        with self._lock:
            return len(self._recent(key)) >= MAX_FAILURES

    def record_failure(self, key):
        with self._lock:
            self._failures[key] = self._recent(key) + [time.monotonic()]

    def reset(self, key):
        with self._lock:
            self._failures.pop(key, None)

    def clear(self):
        with self._lock:
            self._failures.clear()


login_limiter = LoginLimiter()
