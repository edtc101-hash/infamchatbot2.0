# Prompt Engineering Best Practices

This guide provides detailed best practices for crafting effective prompts for Large Language Models (LLMs), based on recommendations from OpenAI and industry experts.

## 1. Core Principles

- **Clarity and Specificity**: Your most important tool is precision. Avoid ambiguity. The model cannot read your mind. Explicitly state the desired context, outcome, length, format, and style.
- **Give the Model a Persona**: Instruct the model to act as a specific persona (e.g., "You are an expert copywriter," or "You are a helpful customer support assistant"). This helps to ground the model and produce more consistent responses.
- **Use Delimiters**: Use clear separators like `###`, `"""`, or XML tags to distinguish between instructions, context, examples, and user input. This helps the model parse the prompt correctly.

## 2. Structuring Your Prompt

A well-structured prompt is easier for the model to understand and follow.

### Instruction First

Place your primary instructions at the beginning of the prompt.

**Good:**
```
Summarize the following text as a bulleted list of key takeaways.

Text: """
{text_input}
"""
```

**Less Effective:**
```
{text_input}

Summarize the text above as a bulleted list.
```

### Show, Don't Just Tell (Few-Shot Prompting)

Provide examples of the desired output format. This is one of the most effective ways to ensure the model produces the output you need.

**Good:**
```
Extract the name and role of the person from the following text.

Text: "The CEO, Jane Doe, announced the new initiative."
Name: Jane Doe
Role: CEO

---

Text: "We spoke with our head of engineering, John Smith."
Name: John Smith
Role: Head of Engineering

---

Text: "{text_input}"
Name:
Role:
```

## 3. Refining Content and Style

### Be Positive and Direct

Instead of telling the model what *not* to do, tell it what *to do*.

**Good:**
```
Translate the following to Spanish. Respond only with the Spanish translation.
```

**Less Effective:**
```
Translate the following to Spanish. Do not include any English words or explanations.
```

### Use Leading Words for Code Generation

To nudge the model towards a specific coding pattern or language, start the response with a leading word.

**Example:**
```python
# Write a Python function to calculate the factorial of a number.
import math

def factorial(n):
```
By providing `import math\ndef`, you guide the model to start writing a Python function.

## 4. Complex Tasks: Chain of Thought

For tasks that require reasoning or multiple steps, instruct the model to "think step by step" or to provide a chain of thought. This forces the model to break down the problem, leading to more accurate results.

**Example:**
```
Question: A jug has 4 red balls and 6 blue balls. If I add 3 green balls and then remove half of the blue balls, how many balls are in the jug?

Let's think step by step:
1. Initial state: 4 red + 6 blue = 10 balls.
2. Add green balls: 10 + 3 green = 13 balls.
3. Remove half of the blue balls: Half of 6 is 3. So, 6 - 3 = 3 blue balls remain.
4. Final count: 4 red + 3 blue + 3 green = 10 balls.

Final Answer: 10
```

By explicitly asking for the reasoning process, you can often correct the model's path if it makes a mistake and improve the final outcome.
