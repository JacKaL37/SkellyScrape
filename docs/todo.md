todos: 
- expose prompting (both phases), 
- implement ai at link scrape, 
- log at bottom, 
- deploy??
- ? hovers, explanations, check boxes for (good, reject etc)
- right-align links (or somehow else)
- give the robot the url during extraction (?)
- add markdown preview for the fulltext of each page fetched (this is what the model sees, the human should see it too)
- massively simplify the ai schlock code that should just be a single structured outputs call with a zod schema, for fuck's sake. fuckin' v0. Don't trust it with AI functionality apart from scrapping around, hey?
  - got a working script up on chatgpt, pull down and integrate
  - add output visualizing model's shorthand for picking the elements on the page.
  - add short "notes" field for reflection?
- integrate human_verification_status into the final output, hard-coded, defaulting to False
- add "to clipboard" button at the output buttons section. 



 