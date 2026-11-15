DeepSeek claims its 'reasoning' model beats OpenAI's o1 on certain benchmarks
TechCrunch, originally published January 20, 2025 (story text as read for the smoke test)

Chinese AI lab DeepSeek has released an open version of DeepSeek-R1, its so-called reasoning model, that it claims performs as well as OpenAI's o1 on certain AI benchmarks.

R1 is available from the AI dev platform Hugging Face under an MIT license, meaning it can be used commercially without restrictions. According to DeepSeek, R1 beats o1 on the benchmarks AIME, MATH-500, and SWE-bench Verified. AIME employs other models to evaluate a model's performance, while MATH-500 is a collection of word problems. SWE-bench Verified, meanwhile, focuses on programming tasks.

Being a reasoning model, R1 effectively fact-checks itself, which helps it to avoid some of the pitfalls that normally trip up models. Reasoning models take a little longer — usually seconds to minutes longer — to arrive at solutions compared to a typical nonreasoning model. The upside is that they tend to be more reliable in domains such as physics, science, and math.

R1 contains 671 billion parameters, DeepSeek revealed in a technical report. Parameters roughly correspond to a model's problem-solving skills, and models with more parameters generally perform better than those with fewer parameters.

Indeed, 671 billion parameters is massive, but DeepSeek also released "distilled" versions of R1 ranging in size from 1.5 billion parameters to 70 billion parameters. The smallest can run on a laptop. As for the full R1, it requires beefier hardware, but it is available through DeepSeek's API at prices 90%-95% cheaper than OpenAI's o1.

There is a downside to R1. Being a Chinese model, it's subject to benchmarking by China's internet regulator to ensure that its responses "embody core socialist values." R1 won't answer questions about Tiananmen Square, for example, or Taiwan's autonomy.

So far, at least three Chinese labs — DeepSeek, Alibaba, and Kimi, which is owned by Chinese unicorn Moonshot AI — have produced models that they claim rival o1. (Of note, DeepSeek was the first — it announced a preview of R1 in late November.)
