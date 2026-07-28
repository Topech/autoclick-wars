# ISSUES

List of issues to work on. Highest priorities from top to bottom. Ask the user to choose which to focus on before starting work. When asking the user which tasks to focus on, add numbers, eg:
	1. task A
	2. task B


## Dev submitted issues
- join button first click sometimes hangs. on cancel then reclick OR refresh it works normally.
- team contributions tickers are inacurrate, we should send the passive contributions once per second BUT get the value from the players metrics, not actual passive. Basically I want to ensure +1s are included, but they're usually rounded down and not shown (hence it sending every 11 ticks not 10)
- tickers on button click should stay alive EVEN after the player clicks again. They should last for their full lifetime.
- bug: the team 5% upgrade does not apply to whole team.
- make the GAME_SERVER_HOST an env var that populates the default client server adress.
- add sound effects on click.
- add more upgrades. They must be present for BOTH teams with same effect but differrent names.
- add a link to the github repo in the bottom right (in join screen and game screen)
- add a line chart showing the team points and player points over time? might be space intensive on server?
- add disclaimer saying progress is not saved on server shutdown, so you may lose your points!

## Agent submitted issues

