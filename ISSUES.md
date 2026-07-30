# ISSUES

## Agents: how to use this file
You prompt the user to choose which tasks to work on. You only do the tasks they EXPLICITLY ask you to do. Do not start on the next task. 


### File Refresh
ALWAYS check if this file has been updated since you last read it. It's more efficient to keep track of the updated datetime than reading the actual file.


### Displaying tasks to user
ALWAYS display the tasks in numbered list format to the user. Summarise to single sentence if required. Eg:
	1. task A
	2. task B


### Marking tasks as finished
Delete the related line to 'mark as complete'. DO NOT keep the task.


### Priorities
Highest priorities from top to bottom. Each list below (Developer/Agent submitted) are of equal priority, as in do not prioritise one over the other.


### Adding Issues
If you're asked to add issues, place them in Agent submitted issues. prepend (user-provided) to the task line.

---


## Issue Lists



### Agent submitted issues

#### Critical — exploitable right now
1. Rate-limit per IP, not per connection
	- key limits on client IP via `x-forwarded-for` / `remoteAddress`
	- refuse if IP already has N open sockets (3–5)
2. Stop player map growing forever
	- enforce one join per socket (ignore further joins after `ws.playerId` is set)
	- evict disconnected players after grace period or cap total records
3. Broadcast on tick, not on every click
	- send `score_update` from the 100 ms loop via `tickCallback(gameState)`
	- remove `score_update` from click/buy_upgrade paths
4. Real rejoin identity instead of adopt-by-name
	- mint secret token on first join, store its hash on player
	- require token to reclaim name; no match → new player

#### Medium — do these next
5. Guard every broadcast send
	- check `readyState === WebSocket.OPEN` before `ws.send`
	- wrap in try/catch to prevent one failure killing the loop
6. Validate and clamp all inputs
	- reject non-string names, cap name length server-side
	- clamp quantity: `Math.max(1, Math.min(1000, Math.floor(Number(msg.quantity)) || 1))`
7. Lock down the socket itself
	- set small `maxPayload` on WebSocketServer
	- add `verifyClient`/origin check to block unauthorized bots

#### Hygiene / perf / robustness
8. Don't recompute scores from scratch each click
	- keep `gnomesScore`/`soldiersScore` as running totals, add delta per click/tick (O(1))
	- reconcile occasionally if worried about float drift
9. Decide what happens on restart
	- persist state to file/DB if scores matter across deploys
10. Add friction against botting (if it continues)
	- lightweight proof-of-work or CAPTCHA at join
	- cap single-player contribution to team score per minute


### Developer submitted issues
- make github actions build the client bc i keep forgetting to. Also re-add client/dist/ to .gitignore once done.
- when you disconnect, sometimes the join button on joinscreen doesn't reconnect on first try. You have to cancel and rejoin. If you reopen the tab esp on phone, it will rejoin for half a second then kick you back to the joinscreen.
- ENSURE users cannot choose team on join through client (the server MUST dictate team distribution)
- add an invite to team link that only works if your team is losing
- team contributions tickers are inacurrate, we should send the passive contributions once per second BUT get the value from the players metrics, not actual passive. Basically I want to ensure +1s are included, but they're usually rounded down and not shown (hence it sending every 11 ticks not 10)
- bug: when viewing on phone, only on the gamescreen (not join screen) the width of the html DOM element is the width of the phone screen, BUT theres empty space to the right, making the page horizontally scrollable. Only the background colour is shown there.
- make the GAME_SERVER_HOST an env var that populates the default client server adress.
- add sound effects on click.
- add a line chart showing the team points and player points over time? might be space intensive on server?
- add a fake human test to the join screen. get them to write a 255 char message to explain why they're a human. Add these as a horizontal gallery (like reviews) under a 'proof you're playing with humans'
- add more upgrades. They must be present for BOTH teams with same effect but differrent names.
- add a health check to server, add UI to show health on join screen in server input
- make actively pressing the button improve your passive clicks temporarily.
- ~~compress websocket messages~~ — not feasible: per-message compression adds significant CPU overhead and memory pressure on the Node.js server (zlib contexts consume ~32KB+ each per connection). With many concurrent players this would exhaust available RAM.

