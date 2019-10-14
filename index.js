var colors = require('colors');
const NetcatClient = require('netcat/client');
const nc = new NetcatClient();


const url = "rkchals.fluxfingers.net";
const port = 5001;
let connection = nc.addr(url).port(port).connect();

const empty = 0;
const oponent = -1;
const bot = 1;

let field;

connection.on("data", function (msg) {
    let resp = String(msg);
    if(resp.includes("Your turn!") || resp.includes("Draw!"))
    {
        field = parseField(resp);
        let depth = empty_cells(field).length;

        let x, y;
        if(depth == 9)
        {
            x = 1;
            y = 1;
        }
        else
        {
            let move = minimax(field, depth, bot);
            x = move[0];
            y = move[1];
        }

        makeMove(x, y, bot);
    }
    //Display Win message
    if(resp.includes("You won"))
    {
        console.log(colors.green(resp));
    }else
    //Display Lose Message (IMPOSSIBLE!!!)
    if(resp.includes("You lost"))
    {
        console.log(colors.red(resp));
    } else
    //Display Draw Message
    if(resp.includes("Draw!"))
    {
        console.log(colors.yellow("Draw!"));
    }
    //Display Flag
    else if(resp.includes("flag"))
    {
        console.log(colors.blue(resp));
    }
});

function parseField(msg) {

    //Cleanup Server Message
    msg = msg.trim();
    msg = msg.replace(/Draw! You still have \d+ wins./g, "");
    msg = msg.replace(/Bot\schose\s\[\d,\s\d\]./g, "");
    msg = msg.replace(/\n/g, "");
    msg = msg.replace("Your turn! [x, y]", "");
    msg = msg.replace(/-/g, "0");
    msg = msg.replace(/x/g, "1");

    let field = [[],[],[]];
    //Parse Server Message into Field
    //Pattern:
    // 123 123 123
    // 111 222 333
    for(let i = 0; i < msg.length; i++)
    {
        if(msg[i] == "o")
        {
            field[i % 3].push(-1);
        }
        else
        {
            field[i % 3].push(parseInt(msg[i]));
        }

    }
    return field;
}

function evaluate(state) {
    let score;
    if(wins(state, bot))
    {
        score = 1;
    }
    else if(wins(state, oponent))
    {
        score = -1;
    }
    else
    {
        score = 0;
    }
    return score;
}

function wins(state, player) {
    //Possible Win Patterns
    let win_state = [
        [state[0][0], state[0][1], state[0][2]],
        [state[1][0], state[1][1], state[1][2]],
        [state[2][0], state[2][1], state[2][2]],
        [state[0][0], state[1][0], state[2][0]],
        [state[0][1], state[1][1], state[2][1]],
        [state[0][2], state[1][2], state[2][2]],
        [state[0][0], state[1][1], state[2][2]],
        [state[2][0], state[1][1], state[0][2]],
    ];

    if(searchForArray(win_state, [player, player, player]) != -1)
    {
        return true;
    }
    else
    {
        return false;
    }
}

function game_over(state)
{
    return wins(state, bot) || wins(state, oponent);
}

function empty_cells(state) {
    let cells = [];
    for(let x = 0; x < state.length; x++)
    {
        let row = state[x];
        for(let y = 0; y < row.length; y++)
        {
            if(row[y] == 0)
            {
                cells.push([x, y]);
            }

        }
    }
    return cells;
}

//Compare Array inside Array
function searchForArray(outterArray, innerArray){
    let i, j, current;
    for(i = 0; i < outterArray.length; ++i){
        if(innerArray.length === outterArray[i].length){
            current = outterArray[i];
            for(j = 0; j < innerArray.length && innerArray[j] === current[j]; ++j);
            if(j === innerArray.length)
                return i;
        }
    }
    return -1;
}

function isMoveValid(x, y) {
    let emptycells = empty_cells(field);
    //If move is allowed
    if(searchForArray(emptycells, [x,y]) != -1 && x <= 2 && y <= 2)
    {
        return true;
    }
    else
    {
        return false;
    }
}

//Send Move to Server
function makeMove(x, y, player) {
    if(isMoveValid(x, y))
    {
        //SEND RESPONS
        nc.send("[" + x + "," + y +"]");
        return true;
    }
    else
    {
        return false;
    }
}

//Minimax Algorithm
function minimax(state, depth, player) {
    let best;
    let score;
    if(player == bot)
    {
        best = [-1, -1, -Infinity];
    }
    else
    {
        best = [-1, -1, +Infinity];
    }

    if(depth == 0 || game_over(state))
    {
        score = evaluate(state);
        return[-1, -1, score];
    }

    let emptycells = empty_cells(state);
    for(let cell = 0; cell < emptycells.length; cell++)
    {
        let x = emptycells[cell][0];
        let y = emptycells[cell][1];
        state[x][y] = player;
        score = minimax(state, depth - 1, -player);
        state[x][y] = 0;
        score[0] = x;
        score[1] = y;

        if(player == bot)
        {
            if(score[2] > best[2])
            {
                best = score
            }
        }
        else
        {
            if(score[2] < best[2])
            {
                best = score
            }
        }
    }
    return best;
}

