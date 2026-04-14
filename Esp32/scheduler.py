import time

class Task:
    def __init__(self, name, interval, callback, iterations=-1):
        self.name = name
        self.interval = interval  # Seconds
        self.callback = callback
        self.iterations = iterations
        self.last_run = time.time()
        self.count = 0

    def should_run(self, now):
        if self.iterations != -1 and self.count >= self.iterations:
            return False
        return (now - self.last_run) >= self.interval

    def run(self, now):
        self.last_run = now
        self.count += 1
        self.callback()

class Scheduler:
    """Simple non-blocking task scheduler."""
    def __init__(self):
        self.tasks = []

    def schedule(self, name, interval, callback, iterations=-1):
        task = Task(name, interval, callback, iterations)
        self.tasks.append(task)
        print(f"[Scheduler] Task '{name}' scheduled every {interval}s")

    def run_pending(self):
        now = time.time()
        for task in self.tasks[:]:
            if task.should_run(now):
                task.run(now)
            
            # Remove finished tasks
            if task.iterations != -1 and task.count >= task.iterations:
                self.tasks.remove(task)
                print(f"[Scheduler] Task '{task.name}' completed.")

    def clear(self):
        self.tasks = []
        print("[Scheduler] All tasks cleared.")

# Example usage:
if __name__ == "__main__":
    sched = Scheduler()
    sched.schedule("Sample", 1, lambda: print("Taking sample..."), iterations=3)
    
    while sched.tasks:
        sched.run_pending()
        time.sleep(0.1)
