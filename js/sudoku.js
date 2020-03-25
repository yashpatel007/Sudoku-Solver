// declare class
var Sudoku, SudokuSolver;

//sudoku game
Sudoku = (function(document) {
    // constructor
    'use strict';
    function Sudoku(div) {
	this.gameDiv = div;
	this.solver = new SudokuSolver();
	this.initDom();
	this.firstRun = true;
	this.newGame();
    }

    /*Generate Sudoku with a unique solution*/
    Sudoku.prototype.generate = function() {
	/*
	  The idea is to shuffle the first row, which gives 9! possibilities,
	  and use the solver to fill the rest of the board.
	  
	  Squares are removed symmetrically and tested to insure the puzzle
	  still has a unique solution.
	 */
	var template = 
	    [[1,2,3,4,5,6,7,8,9],
	     [0,0,0,0,0,0,0,0,0],
	     [0,0,0,0,0,0,0,0,0],
	     [0,0,0,0,0,0,0,0,0],
	     [0,0,0,0,0,0,0,0,0],
	     [0,0,0,0,0,0,0,0,0],
	     [0,0,0,0,0,0,0,0,0],
	     [0,0,0,0,0,0,0,0,0],
	     [0,0,0,0,0,0,0,0,0]];

	var fRow = template[0];

	// Shuffle first row
	for(var i = 0; i < 9; i++) {
	    var rand = Math.floor(Math.random() * 9);
	    var temp = fRow[i];
	    fRow[i] = fRow[rand];
	    fRow[rand] = temp;
	}
	//console.log(template)

	// Generate 3 solutions and pick one at random
	var solutions = this.solver.solutions(template, 3);
	var rand = Math.floor(Math.random() * 3)
	var solution = solutions[rand];
	if (!this.validate(solution)) {
	    throw 'Sudoku invalid!';
	}

	// Start removing keys symmetrically and test for uniqueness
	var puzzle = JSON.parse(JSON.stringify(solution));
	var count = 0;
	while (count < 30) {
	    var row = Math.floor(Math.random() * 9);
	    var col = Math.floor(Math.random() * 9);
	    var mRow = 8 - row;
	    var mCol = 8 - col;
	    var val = puzzle[row][col];
	    var mVal = puzzle[mRow][mCol];
	    puzzle[row][col] = 0;
	    puzzle[mRow][mCol] = 0;
	    var solutions = this.solver.solutions(puzzle, 2);
	    if (solutions.length === 1) {
		count++;
	    } else {
		puzzle[row][col] = val;
		puzzle[mRow][mCol] = mVal;
	    }
	}

	return [puzzle, solution];
    }

    /*
      Builds DOM Elements
     */
    Sudoku.prototype.initDom = function() {
	var table = document.createElement('table');
	table.classList.add('sudoku_table')

	var tbody = document.createElement('tbody');
	for (var row = 1; row <= 9; row++) {
	    var tr = document.createElement('tr');

	    for (var col = 1; col <= 9; col++) {
		var td = document.createElement('td');

		if (row == 4 || row == 7 ) {
		    td.classList.add('heavy_top');
		} else if (row != 1) {
		    td.classList.add('thin_top');
		}

		if (col == 4 || col == 7) {
		    td.classList.add('heavy_left');
		} else if (col != 1) {
		    td.classList.add('thin_left')
		}

		var input = document.createElement('input');
		input.id = row.toString() + col.toString();
		input.setAttribute('maxlength', 1);
		input.setAttribute('type', 'tel'); // Shows numeric keypad on iOS
		td.appendChild(input);
		tr.appendChild(td);
	    }
	    tbody.appendChild(tr);

	}
	table.appendChild(tbody);
	this.gameDiv.appendChild(table);

	// Create buttons
	var buttons = document.createElement('div');
	buttons.classList.add('sudoku_btns');

	var checkBtn = document.createElement('input');
	checkBtn.type = 'button';
	checkBtn.value = 'CHECK';
	checkBtn.classList.add('sudoku_btn');
	checkBtn.classList.add('first');

	var solveBtn = document.createElement('input');
	solveBtn.type = 'button';
	solveBtn.value = 'SOLVE';
	solveBtn.classList.add('sudoku_btn');
	solveBtn.classList.add('second');

	var clearBtn = document.createElement('input');
	clearBtn.type = 'button';
	clearBtn.value = 'RESET';
	clearBtn.classList.add('sudoku_btn')
	clearBtn.classList.add('third');

	var newBtn = document.createElement('input');
	newBtn.type = 'button';
	newBtn.value = 'NEW GAME';
	newBtn.classList.add('sudoku_btn');
	newBtn.classList.add('last');

	buttons.appendChild(checkBtn);
	buttons.appendChild(solveBtn);
	buttons.appendChild(clearBtn);
	buttons.appendChild(newBtn);

	this.gameDiv.appendChild(buttons);

	var self = this;
	checkBtn.addEventListener('click', function() {
	    self.check();
	});

	clearBtn.addEventListener('click', function() {
	    self.clear();
	});

	solveBtn.addEventListener('click', function() {
	    self.solve();
	});

	newBtn.addEventListener('click', function() {
	    self.newGame();
	});
    }

    /*
      Updates DOM with Sudoku model
     */
    Sudoku.prototype.updateDom = function(model) {
	for (var row = 0; row < 9; row++) {
	    for (var col = 0; col < 9; col++) {
		var id = (row + 1).toString() + (col + 1).toString();
		var input = document.getElementById(id);
		var value = model[row][col];
		if (value) {
		    input.value = value;
		    input.setAttribute('readonly',true);
		    input.classList.remove('user_edit');
		} else {
		    input.value = '';
		    input.removeAttribute('readonly');
		    input.classList.add('user_edit');
		}
	    }
	}
    }

    /*
      Gets Sudoku model from DOM
     */
    Sudoku.prototype.getDom = function() {
	var model = []
	for (var r = 0; r < 9; r++) {
	    var row = [];
	    for (var c = 0; c < 9; c++) {
		var id = (r + 1).toString() + (c + 1).toString();
		var input = document.getElementById(id);
		var value = parseInt(input.value) || 0;
		row.push(value);
	    }
	    model.push(row);
	}
	return model;
    }

    /*
      Checks puzzle for errors
     */
    Sudoku.prototype.check = function() {
	this.clearHighlights();
	var userModel = this.getDom();
	var isComplete = true;
	var noErrors = true;
		 
	for (var i = 0; i < 9; i++) {
	    for (var j = 0; j < 9; j++) {
		if (userModel[i][j] === 0){
		    isComplete = false;
		} else if (userModel[i][j] !== this.solutionModel[i][j]) {
		    this.highlight(i,j);
		    noErrors = false;
		}
	    }
	}

	if (noErrors) {
	    if (isComplete) {
		alert('You finished!');
	    } else {
		alert('Everything looks good');
	    }
	}
    }

    /*
      Highlights cell
     */
    Sudoku.prototype.highlight = function(row, col) {
	var id = (row + 1).toString() + (col + 1).toString();
	var elem = document.getElementById(id);
	elem.classList.add('user_error');
    }

    /*
      Clears all highlights
     */
    Sudoku.prototype.clearHighlights = function() {
	var elems = document.getElementsByClassName('user_error');
	for (var i = 0; i < elems.length; i++) {
	    elems[i].classList.remove('user_error');
	}
    }

    /*
      Clears user input
     */
    Sudoku.prototype.clear = function() {
	var bool = confirm('Are you sure you want to clear?');
	if (bool) {
	    this.clearHighlights();
	    this.updateDom(this.masterModel);
	}
    }

    /*
      Solves Puzzle
     */
    Sudoku.prototype.solve = function() {
	var bool = confirm('Are you sure you want to see the solution?');
	if (bool) {
	    this.updateDom(this.solutionModel);
	}
    }

    /*
      New Game
     */
    Sudoku.prototype.newGame = function() {
	var bool = true;
	if (!this.firstRun) {
	    var bool = confirm('Are you sure you want a new game?');
	}
	if (bool) {
	    var models = this.generate();
	    this.masterModel = models[0];
	    this.solutionModel = models[1];
	    this.updateDom(this.masterModel);
	}
	this.firstRun = false;
    }

    /*
      Validate Sudoku
     */
    Sudoku.prototype.validate = function(sudoku) {
	function validate(range) {
	    if (range.length !== 9) {
		return false;
	    }
	    var index = [];
	    for (var i = 0; i < 9; i++) {
		var val = range[i];
		if (index[val] || val < 1 || val > 9) {
		    return false;
		}
		index[val] = true;
	    }
	    return true;
	}

	function getRow(i){
	    return sudoku[i];
	}

	function getCol(i) {
	    var range = [];
	    for (var i = 0; i < 9; i++) {
		range.push(sudoku[i][0]);
	    }
	    return range;
	}

	/*
	  0 1 2
	  3 4 5
	  6 7 8
	*/
	function getBox(i) {
	    var range = [];
	    var rStart = 3 * Math.floor(i / 3);
	    var cStart = 3 * (i % 3);
	    
	    for (var r = rStart; r < rStart + 3; r++) {
		for (var c = cStart; c < cStart + 3; c++) {
		    range.push(sudoku[r][c]);
		}
	    }
	    
	    return range;
	}

	for (var i = 0; i < 9; i++) {
	    var row = validate(getRow(i));
	    var col = validate(getCol(i));
	    var box = validate(getBox(i));
	    if (!row || !col || !box) {
		return false;
	    }
	}
	return true;
    }

    /*
      Run tests
     */
    Sudoku.prototype.test = function() {
	function assert(condition, num) {
	    if (!condition) {
		throw 'Test ' + num + ': failed';
	    } else {
		console.log('Test ' + num + ': passed');
            }
	}

	// Solution Unit Tests
	var testSudoku = 
	    [[0,0,0,0,8,0,0,2,0],
	     [0,3,0,0,5,1,8,0,6],
	     [0,2,8,0,4,0,7,5,0],
	     [0,0,1,0,0,0,0,3,4],
	     [2,0,0,3,9,5,0,0,8],
	     [3,8,0,0,0,0,2,0,0],
	     [0,1,9,0,7,0,3,4,0],
	     [8,0,2,4,3,0,0,1,0],
	     [0,5,0,0,6,0,0,0,0]];

	var testSolution =
	    [[5,9,6,7,8,3,4,2,1],
	     [7,3,4,2,5,1,8,9,6],
	     [1,2,8,9,4,6,7,5,3],
	     [9,6,1,8,2,7,5,3,4],
	     [2,4,7,3,9,5,1,6,8],
	     [3,8,5,6,1,4,2,7,9],
	     [6,1,9,5,7,8,3,4,2],
	     [8,7,2,4,3,9,6,1,5],
	     [4,5,3,1,6,2,9,8,7]];

	var solutions = this.solver.solutions(testSudoku);

	// Test 1 - Only one solution
	assert(solutions.length === 1, 1);
	
	// Test 2 - Solution is correct
	function sudokusEqual(a, b) {
	    for (var i = 0; i < 9; i++) {
		for (var j = 0; j < 9; j++) {
		    if (a[i][j] != b[i][j]) {
			return false;
		    }
		}
	    }
	    return true;
	}
	assert(sudokusEqual(testSolution, solutions[0]), 2);

	for (var i = 0; i < 5; i++) {
	    var models = this.generate();
	    var puzzle = models[0];
	    var solution = models[1];

	    var solutions = this.solver.solutions(puzzle);
	    // Test 3 - Generated Puzzles have a unique solution
	    assert(solutions.length === 1, 3);

	    // Test 4 - Solutions match
	    assert(sudokusEqual(solution, solutions[0]), 4);
	}

	// Test 5 - Test sudoku invalid
	assert(this.validate(testSudoku) === false, 5);

	// Test 6 - Test solution valid
	assert(this.validate(testSolution) === true, 6);

	var badSudoku =
	   [[8,3,5,4,1,6,9,2,7],
	    [2,9,6,8,5,7,4,3,1],
	    [4,1,7,2,9,3,6,5,8],
	    [5,6,9,1,3,4,7,8,2],
	    [1,2,3,6,7,8,5,4,9],
	    [7,4,8,5,2,9,1,6,3],
	    [6,5,2,7,8,1,3,9,4],
	    [9,8,1,3,4,5,2,7,6],
	    [3,7,4,9,6,2,8,1,1]];

	// Test 7 - Bad sudoku invalid
	assert(this.validate(badSudoku) === false, 7);

	var badPuzzle =
	   [[1,1,1,1,1,1,1,1,1],
	    [0,0,0,0,0,0,0,0,0],
	    [0,0,0,0,0,0,0,0,0],
	    [0,0,0,0,0,0,0,0,0],
	    [0,0,0,0,0,0,0,0,0],
	    [0,0,0,0,0,0,0,0,0],
	    [0,0,0,0,0,0,0,0,0],
	    [0,0,0,0,0,0,0,0,0],
	    [0,0,0,0,0,0,0,0,0]];

	// Test 8 - Bad puzzle has no solutions
	var solutions = this.solver.solutions(badPuzzle);
	assert(solutions.length === 0, 8);

	// Tests passed!
	return true;
    }

    return Sudoku;
})(document);

/*
  Solves Sudoku
  Implements Knuth's Dancing Links/Algorithm X
 */
SudokuSolver = (function(document) {
    function SudokuSolver() {}

    /*
      Returns array of sudoku solutions
     */
    SudokuSolver.prototype.solutions = function(sudoku, maxsolutions) {
	var self = this;
	var mat = self.buildCoverMatrix(sudoku);
	var root = self.buildDancingLinks(mat);
	var solutions = [];
	var rawSolutions = [];
	self.search(root, [], rawSolutions, maxsolutions);
	for(var i = 0; i < rawSolutions.length; i++) {
	    solutions.push(self.solutionToSudoku(rawSolutions[i]));
	}
	return solutions;
    }

    /*
      Converts array of coordinate objects to a sudoku board
     */
    SudokuSolver.prototype.solutionToSudoku = function(solution) {
	var sudoku = [];
	for(var i = 0; i < 9; i++) {
	    sudoku.push([]);
	}
	for(var j = 0; j < solution.length; j++) {
	    var row = solution[j].r;
	    var col = solution[j].c;
	    var num = solution[j].n;
	    sudoku[row][col] = num;
	}
	return sudoku;
    }

    /*
      Exact Cover Matrix
      http://www.stolaf.edu/people/hansonr/sudoku/exactcovermatrix.htm
     */
    SudokuSolver.prototype.buildCoverMatrix = function(sudoku) {
	function buildRow(r, c, n) {
	    var row = new Array(324); // 9 * 9 * 4 constraints
	    // Store prop to build sudoku model later
	    var prop = { r: r, c: c, n: n + 1 };

	    // 1 num per square
	    row[r * 9 + c] = prop;
	    // 1 of each num per row
	    row[81 + r * 9 + n] = prop;
	    // 1 of each num per column
	    row[162 + c * 9 + n] = prop;
	    // 1 of each num per box
	    row[243 + (Math.floor(r/3) * 3 + Math.floor(c/3)) * 9 + n] = prop;

	    return row;
	}

	var mat = [];

	for(var r = 0; r < 9; r++) {
	    for (var c = 0; c < 9; c++) {
		var val = sudoku[r][c] - 1; // Zero-indexing
		if (val >= 0) {
		    mat.push(buildRow(r,c,val));
		} else {
		    for(var n = 0; n < 9; n++) {
			mat.push(buildRow(r,c,n));
		    }
		}
	    }
	}

        return mat;
    }

    /*
      Exact Cover Matrix to sparse Linked List representation
     */
    SudokuSolver.prototype.buildDancingLinks = function(mat) {
	var nCol = mat[0].length;
	var nRow = mat.length;

	// Build header nodes
	var headers = [];
	for(var i = 0; i < nCol; i++) {
	    headers[i] = {};
	}

	for(var i = 0; i < nCol; i++) {
	    var header = headers[i];
	    header.index = i;
	    header.up = header;
	    header.down = header;
	    if (i > 0) {
		header.left = headers[i - 1];
	    }
	    if (i + 1 < nCol) {
		header.right = headers[i + 1];
	    }
	    header.count = 0;
	}

	// Build nodes
	for(var row = 0; row < nRow; row++) {
	    var last = null;
	    for(var col = 0; col < nCol; col++) {
		if(mat[row][col]) {
		    var node = {}
		    node.prop = mat[row][col];
		    node.header = headers[col];
		    node.up = headers[col].up;
		    node.down = headers[col];
		    if (last) {
			node.left = last;
			node.right = last.right;
			last.right.left = node;
			last.right = node;
		    } else {
			node.left = node;
			node.right = node;
		    }
		    headers[col].up.down = node;
		    headers[col].up = node;
		    headers[col].count++;
		    last = node;
		}
	    }
	}

	// Root node
	var root = {};
	root.right = headers[0];
	root.left = headers[headers.length - 1];
	headers[0].left = root;
	headers[headers.length - 1].right = root;

	return root;
    }

    /*
      Removes column and rows in the column
     */
    SudokuSolver.prototype.cover = function(node) {
	node.right.left = node.left;
	node.left.right = node.right;
	for(var rNode = node.down; rNode !== node; rNode = rNode.down) {
	    for(var cNode = rNode.right; cNode !== rNode; cNode = cNode.right) {
		cNode.down.up = cNode.up;
		cNode.up.down = cNode.down;
		cNode.header.count--;
	    }
	}
    }
    
    /*
      Restores column and rows in the column
     */
    SudokuSolver.prototype.uncover = function(node) {
	for (var rNode = node.up; rNode != node; rNode = rNode.up) {
            for (var cNode = rNode.left; cNode != rNode; cNode = cNode.left) {
                cNode.down.up = cNode;
                cNode.up.down = cNode;
                cNode.header.count++;
            }
        }
        node.right.left = node;
        node.left.right = node;
    }
    
    /*
      Searches for solutions
     */
    SudokuSolver.prototype.search = function(root, solution, solutions, maxsolutions) {
	// Base Case - All columns are removed
	if (root.right === root) {
	    if (solution.length === 81) {
		solutions.push(solution.slice(0));
	    }
	    if (solutions.length >= maxsolutions) {
		return solutions;
	    }
	    return;
	}

	var header;
	var count = 1000;
	// Find column with the fewest nodes
	for (var col = root.right; col !== root; col = col.right) {
	    if (col.count === 0) {
		return;
	    }
	    if (col.count < count) {
		count = col.count;
		header = col;
	    }
	}
	this.cover(header);

	// Brute force iteration through nodes
	for (var rNode = header.down; rNode !== header; rNode = rNode.down) {
	    solution.push(rNode.prop)
	    for (var cNode = rNode.right; cNode !== rNode; cNode = cNode.right) {
		this.cover(cNode.header);
	    }

	    var result = this.search(root, solution, solutions, maxsolutions);

	    if (result) {
		// Solution found!
		return result;
	    }

	    // No solution found, undo changes
	    for (var cNode = rNode.right; cNode !== rNode; cNode = cNode.right) {
		this.uncover(cNode.header);
	    }
	    solution.pop()
	}

	this.uncover(header);
    }

    return SudokuSolver;
})(document);
