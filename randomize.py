import json
import random

class Randomize:
    def __init__(self,file_path):
        self.file_path = file_path

    def read(self):
        try:
            with open(self.file_path, 'r') as f:
                self.data = json.load(f)
                if not isinstance(self.data, dict):
                    self.data = {}
                return self.data
        except json.JSONDecodeError as e:
            print(f"JSON decoding failed: {e.msg}")
            
    def random(self):
        self.list= self.read()
        self.key_list = list(self.list.keys())
        self.q_random = random.sample(self.key_list, min(5, len(self.data)))
        return self.q_random
        

quiz = Randomize("soal.json")
quiz_select = quiz.random()
print(quiz_select)