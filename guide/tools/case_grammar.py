"""The case-file model's world: the course model's animal sentences, plus name stories with an indirect-object answer
("tom and ann went to the park . ann gave a ball to" -> tom), plus "then it was ADJ", which must repeat the subject's
adjective. Used by tools/train_model.py --case.

Every choice is made when its word is emitted, so passage() knows the exact distribution each word was drawn from,
given everything before it. Passages always start at a sentence start, so those distributions are the best any model
could predict, and their average loss is the floor a trained model can approach."""
VOCAB = ['<bos>', 'the', 'a', 'cat', 'dog', 'bird', 'sat', 'ran', 'slept', 'on', 'under', 'mat', 'bed', 'and', 'chased',
          'saw', '.', 'big', 'small', 'red', 'then', 'to', 'home', 'it', 'was', 'tom', 'ann', 'sam', 'max', 'went', 'park', 'gave', 'ball']
NAMES = ['tom', 'ann', 'sam', 'max']
ADJS = ['big', 'small', 'red']
START = {'the': 0.25, 'a': 0.25, **{n: 0.125 for n in NAMES}}   # animal sentence 50%, name sentence 50% (story 60% of those)
VP1 = {'sat': 0.28, 'ran': 0.18, 'slept': 0.12, 'chased': 0.11, 'saw': 0.31}

def passage(rand, n):
    """Returns [(word, dist)] of at least n words; dist is the exact next-word distribution the word was drawn from."""
    out = []
    def pick(dist):
        x, acc = rand(), 0.0
        for w, p in dist.items():
            acc += p
            if x < acc: break
        out.append((w, dist)); return w
    def say(w): out.append((w, {w: 1.0})); return w
    def noun_phrase(det):
        first = pick({**{a: 0.1 for a in ADJS}, **{nn: 0.7 / 3 for nn in ['cat', 'dog', 'bird']}})
        if first in ADJS: pick({nn: 1 / 3 for nn in ['cat', 'dog', 'bird']}); return first
        return None
    def np_full(): return noun_phrase(pick({'the': 0.5, 'a': 0.5}))
    def verb_phrase(v):
        if v == 'sat': pick({'on': 0.5, 'under': 0.5}); say('the'); pick({'mat': 0.5, 'bed': 0.5}); say('.')
        elif v == 'ran':
            if pick({'home': 0.5, 'to': 0.5}) == 'to': say('the'); pick({'mat': 1 / 3, 'bed': 1 / 3, 'park': 1 / 3})
            say('.')
        elif v == 'slept': say('.')
        elif v == 'chased': np_full(); say('.')
        elif v == 'saw':
            np_full()
            if pick({'.': 0.11 / 0.31, 'and': 0.20 / 0.31}) == 'and': np_full(); say('.')
    after = {'then': 0.35, **{w: 0.65 * p for w, p in START.items()}}
    then_it = lambda adj: {**{v: 0.5 / 3 for v in ['sat', 'ran', 'slept']}, 'was': 0.5} if adj else {v: 1 / 3 for v in ['sat', 'ran', 'slept']}
    first = pick(START)                         # each sentence's first word is drawn at the end of the one before
    while len(out) < n:
        if first in ('the', 'a'):               # animal sentence, optionally followed by "then it ..."
            adj = noun_phrase(first); verb_phrase(pick(VP1))
            first = pick(after)
            if first == 'then':
                say('it')
                if pick(then_it(adj)) == 'was': say(adj)
                say('.'); first = pick(START)
        else:                                   # name sentence or name story
            name_sentence(first, pick, say, verb_phrase); first = pick(START)
    return out

def name_sentence(n1, pick, say, verb_phrase):
    w = pick({'and': 0.6, **{v: 0.4 * p for v, p in VP1.items()}})
    if w != 'and': verb_phrase(w); return
    n2 = pick({n: 1 / 3 for n in NAMES if n != n1})
    for x in ['went', 'to', 'the', 'park', '.']: say(x)
    giver = pick({n1: 0.5, n2: 0.5})
    for x in ['gave', 'a', 'ball', 'to']: say(x)
    say(n2 if giver == n1 else n1); say('.')
