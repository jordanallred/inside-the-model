# Contributing

Inside the Model promises that every number on the site can be checked. Reports of mistakes are the most useful contribution you can make, and every page has a **Report a problem with this page** link at the bottom that opens a prefilled issue.

## Reporting a problem

[Open an issue](https://github.com/jordanallred/inside-the-model/issues/new/choose) and pick the form that fits:

- **Problem with a page**: a wrong number, equation, claim or citation; a typo; an explanation that does not make sense; a widget that is broken or misleading.
- **Suggestion**: a topic, lab, widget or improvement you would like to see.
- **Licensing question**: any use the [license](LICENSE) does not already allow.

A good report says where the problem is, what is wrong, and what you expected instead. For a factual or mathematical correction, include a source: a paper, model card, technical report or a calculation anyone can repeat. Claims on the site are held to that standard, so corrections are too.

For a broken widget, say which browser and device you used and what you clicked.

## Before opening a pull request

- **Typos and small fixes** can go straight to a pull request.
- **Anything larger** (a new section, a rewrite, a new widget or lab, a design change) needs an issue first, so we can agree on the approach before you spend time on it. Pull requests for large changes without a prior issue may be closed.

Each pull request should do one thing and explain why in its description.

## Working on the site

Setup and the full list of commands are in the [README](README.md). Before you open a pull request, run these inside `guide/` and make sure they pass:

```bash
npm run build
```

```bash
npm run check
```

If you changed the model engine (`guide/public/js/itm-model.js`) or the NumPy reference (`guide/public/code/itm_model.py`), also run `npm run verify`. The two must agree to within 1e-9.

## Writing guidelines

- **Be exact.** Prefer a concrete number or worked example to a general statement, and show the calculation before stating the rule.
- **Cite primary sources.** Papers go in `guide/public/js/papers.js` and are cited with `<cite data-p="key" data-s></cite>`. Claims about a specific model come from its technical report or model card. If something cannot be confirmed, say so on the page.
- **Name simplifications.** The teaching model is tiny on purpose. Say so wherever it differs from production systems.
- **Avoid hype.** No "magic", "secrets of AI" or "the model thinks". Describe what the computation does. Write in plain, exact language, and say what is simplified.
- **Keep it accessible.** Widgets must work with a keyboard, respect reduced motion, fit a phone screen, and expose their values as numbers, not only as color.

## Use of AI tools

You may use AI tools to help, but you are responsible for every line you submit. Check every number, equation and citation yourself. Pull requests that contain invented citations, unverified claims or code that was never run will be closed.

## Licensing of contributions

The project is licensed under the terms in [LICENSE](LICENSE). By submitting a contribution (a pull request, or text or code in an issue meant to be included in the project), you agree that:

1. you wrote it, or otherwise have the right to submit it;
2. it is licensed under the same terms as the part of the project it belongs to; and
3. you also grant the Inside the Model project a perpetual, worldwide, royalty-free, irrevocable license to use, modify, and distribute your contribution under any terms, including commercial terms.

Point 3 lets the project offer the material in other forms, such as a printed edition, without having to track down every contributor. It does not take away your own right to use your contribution elsewhere.

## Conduct

Be respectful and assume good faith. Criticize ideas and claims, not people. Harassment, personal attacks and spam will be removed, and the people responsible may be blocked.
