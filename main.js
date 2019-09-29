// Model classes for graph and edges
class Graph {
	constructor(noOfVertices) {
		this.noOfVertices = noOfVertices;
		this.AdjList = new Map();
	}

	addVertex(v) {
		this.AdjList.set(v, []);
	}

	addEdge(src, dest) {
		this.AdjList.get(src).push(dest);
	}
}

class Edge {
	constructor(vertexA, vertexB) {
		this.vertexA = vertexA;
		this.vertexB = vertexB;
	}

	toString() {
		return "A:" + this.vertexA.x + " " + this.vertexA.y + " B:" + this.vertexB.x + " " + this.vertexB.y;
	}
}

// AVL tree is used as balanced binary search tree of intersected edges
var avlTree = new AvlTree(compareEdges);

var xml;
var xmlPoints;
var polygons;
var endPoints;
var allPoints = [];
var highlightedEllipse = -1;
var buttonVG;
var buttonDist;
var buttonDijsktra;
var graph;
var fixedPoint;
var maxPoint;
var prevVertex = null;
var prevVertexVisible = false;
var ignoreLastVerticeMode = false;
var lastMin = null;
var startPoint;
var shortestPath = null;

// Load the data
function preload() {
	xml = loadXML('input/polygons3.xml');
	xmlPoints = loadXML('input/points3.xml');
}

// Setup the visuals, initialize the Graph, initialize all vertices
function setup() {
	noLoop();
	createCanvas(10000, 10000);
	polygons = xml.getChildren('polygon');
	endPoints = xmlPoints.getChildren('point');

	maxPoint = {
		x: 0,
		y: 0
	};

	buttonVG = createButton('Calculate Visibility Graph');
	buttonVG.position(0, 0);
	buttonVG.mousePressed(calculateVisibiltyGraph);

	var noOfVertices = 2;
	for (var i = 0; i < polygons.length; i++) {
		var polygon = polygons[i];
		var points = polygon.getChildren('point');

		for (var j = 0; j < points.length; j++) {
			noOfVertices++;
		}
	}

	graph = new Graph(noOfVertices);
	var vertexCount = 2;

	allPoints.push({
		number: 0,
		x: endPoints[0].getNum('x'),
		y: endPoints[0].getNum('y'),
		polygon: -1
	});
	graph.addVertex(0);

	allPoints.push({
		number: 1,
		x: endPoints[1].getNum('x'),
		y: endPoints[1].getNum('y'),
		polygon: -2
	});
	graph.addVertex(1);

	for (var i = 0; i < polygons.length; i++) {
		var polygon = polygons[i];
		var points = polygon.getChildren('point');

		var helpVertexCount = vertexCount;

		for (var j = 0; j < points.length; j++) {
			allPoints.push({
				number: vertexCount,
				x: points[j].getNum('x'),
				y: points[j].getNum('y'),
				incidentVertices: [],
				polygon: i
			});
			graph.addVertex(vertexCount++);
		}

		for (var j = 0; j < points.length; j++) {
			if (j == 0) {
				allPoints[helpVertexCount].incidentVertices.push(helpVertexCount + 1);
				allPoints[helpVertexCount].incidentVertices.push(helpVertexCount - 1 + points.length);
				helpVertexCount++;
			} else if (j == points.length - 1) {
				allPoints[helpVertexCount].incidentVertices.push(helpVertexCount + 1 - points.length);
				allPoints[helpVertexCount].incidentVertices.push(helpVertexCount - 1);
			} else {
				allPoints[helpVertexCount].incidentVertices.push(helpVertexCount + 1);
				allPoints[helpVertexCount].incidentVertices.push(helpVertexCount - 1);
				helpVertexCount++;
			}
		}
	}

}

// Function that draws the visuals every time something changes
function draw() {
	clear();
	background('rgba(0,255,0, 0.25)');
	fill(255, 127);

	for (var i = 0; i < polygons.length; i++) {
		var polygon = polygons[i];
		var points = polygon.getChildren('point');

		beginShape();
		for (var j = 0; j < points.length; j++) {
			vertex(points[j].getNum('x'), points[j].getNum('y'));
		}
		endShape(CLOSE);
	}

	for (var j = 0; j < allPoints.length; j++) {
		if (shortestPath != null) {
			if (shortestPath.includes(j)) {
				fill(255, 0, 0, 255);
				if (j != 0) {
					push();
					stroke('red');
					var currIndex = shortestPath.indexOf(j);
					line(allPoints[j].x, allPoints[j].y, allPoints[shortestPath[currIndex + 1]].x, allPoints[shortestPath[currIndex + 1]].y);
					pop();
				}
			} else {
				fill(0, 0, 255, 55);
			}
		} else {
			if (j === highlightedEllipse) {
				fill(255, 0, 0, 255);
				push();
				stroke('red');
				var listOfAdj = graph.AdjList.get(j);
				for (var adj of listOfAdj) {
					line(allPoints[j].x, allPoints[j].y, allPoints[adj.otherVertex].x, allPoints[adj.otherVertex].y);
				}
				pop();
			} else {
				fill(0, 0, 255, 55);
			}
		}
		ellipse(allPoints[j].x, allPoints[j].y, 10, 10);
	}
	noFill();
}

function mousePressed() {
	highlightedEllipse = -1;
	for (var i = 0; i < allPoints.length; i++) {
		if (abs(mouseX - allPoints[i].x) < 10 && abs(mouseY - allPoints[i].y) < 10) {
			highlightedEllipse = i;
			break;
		}
	}
	redraw();
}

function calculateDijsktra() {
	var dijkstraRes = dijkstra(allPoints, startPoint, graph);
	console.log(dijkstraRes);

	shortestPath = [];
	shortestPath.push(1);
	var currVertex = dijkstraRes.previousVertices[1];
	while (currVertex.number != 0) {
		shortestPath.push(currVertex.number);
		currVertex = dijkstraRes.previousVertices[currVertex.number];
	}

	shortestPath.push(0);
	console.log(shortestPath);
}

function eucDistance(pointA, pointB) {
	return sqrt(pow(pointB.y - pointA.y, 2) + pow(pointB.x - pointA.x, 2));
}

function calculateEuclidieanDistances() {
	for (var vertex of allPoints) {
		var edgeList = graph.AdjList.get(vertex.number);
		for (var edge of edgeList) {
			edge.distance = eucDistance(vertex, allPoints[edge.otherVertex]);
		}
	}
	startPoint = allPoints[0];
	buttonDijsktra = createButton('Calculate Shortest Path');
	buttonDijsktra.position(435, 0);
	buttonDijsktra.mousePressed(calculateDijsktra);
}

function calculateVisibiltyGraph() {
	for (var vertex of allPoints) {
		var visibleFromVertex = visibleVertices(vertex);
		for (var visibleVertex of visibleFromVertex) {
			if (vertex.number != visibleVertex.number) {
				var edgeToAdd = {
					otherVertex: visibleVertex.number,
					distance: 0
				};
				graph.addEdge(vertex.number, edgeToAdd);
			}
		}
	}
	buttonDist = createButton('Calculate Euclidiean Distances');
	buttonDist.position(200, 0);
	buttonDist.mousePressed(calculateEuclidieanDistances);
}

function visibleVertices(currentVertex) {
	var allOtherPoints = allPoints.slice();
	for (var otherPoint of allOtherPoints) {
		otherPoint.distance = dist(currentVertex.x, currentVertex.y, otherPoint.x, otherPoint.y);
		push();
		angleMode(DEGREES);
		translate(currentVertex.x, currentVertex.y);
		var vector = createVector(otherPoint.x - currentVertex.x, otherPoint.y - currentVertex.y);
		otherPoint.angle = +(vector.heading());
		if (otherPoint.angle < 0) {
			var angle = otherPoint.angle;
			otherPoint.angle = angle + 360.0;
		}
		pop();
	}
	allOtherPoints.sort(compareVerticesByAngle);

	var res = [];

	avlTree = new AvlTree(compareEdges);

	fixedPoint = currentVertex;
	prevVertex = null;

	for (var onePoint of allPoints) {
		if (onePoint.number == 0 || onePoint.number == 1 || onePoint.number == currentVertex.number || allPoints[onePoint.incidentVertices[0]].number == currentVertex.number) {
			continue;
		}
		maxPoint.x = 50000;
		maxPoint.y = 0;
		if (lineIntersection(0, 0, maxPoint.x, maxPoint.y, onePoint.x - currentVertex.x, currentVertex.y - onePoint.y, allPoints[onePoint.incidentVertices[0]].x - currentVertex.x, currentVertex.y - allPoints[onePoint.incidentVertices[0]].y)) {
			var edge = new Edge(onePoint, allPoints[onePoint.incidentVertices[0]]);
			avlTree.insert(edge);
		}
	}

	for (var i = 0; i < allOtherPoints.length; i++) {
		if (allOtherPoints[i].number != currentVertex.number) {
			if (allOtherPoints[i].x - currentVertex.x != 0) {
				var slope =	(-(currentVertex.y - allOtherPoints[i].y)) / (-(allOtherPoints[i].x - currentVertex.x));
				if (abs(slope) > 1) {
					if (currentVertex.y - allOtherPoints[i].y > 0) {
						maxPoint.y = 50000;
						maxPoint.x = 50000 / slope;
					} else {
						maxPoint.y = -50000;
						maxPoint.x = -50000 / slope;
					}
				} else {
					if (allOtherPoints[i].x - currentVertex.x > 0) {
						maxPoint.x = 50000;
						maxPoint.y = slope * 50000;
					} else {
						maxPoint.x = -50000;
						maxPoint.y = slope * -50000;
					}
				}
			} else {
				if (currentVertex.y - allOtherPoints[i].y > 0) {
					maxPoint.x = 0;
					maxPoint.y = 50000;
				} else {
					maxPoint.x = 0;
					maxPoint.y = 50000;
				}
			}
			if (visible(allOtherPoints[i])) {
				res.push(allOtherPoints[i]);
			}
			if (allOtherPoints[i].number != 0 && allOtherPoints[i].number != 1) {
				for (var incidentVertex of allOtherPoints[i].incidentVertices) {
					push();
					translate(currentVertex.x, currentVertex.y);
					var v1 = createVector(allOtherPoints[i].x - currentVertex.x, allOtherPoints[i].y - currentVertex.y, 0);
					var v2 = createVector(allPoints[incidentVertex].x - currentVertex.x, allPoints[incidentVertex].y - currentVertex.y, 0);
					var crossProduct = p5.Vector.cross(v1, v2);
					var edge = new Edge(allOtherPoints[i], allPoints[incidentVertex]);
					if (crossProduct.z < 0) {
						avlTree.delete(edge);
						lastMin = avlTree.findMinimum();
					} else if (crossProduct.z > 0) {
						avlTree.insert(edge);
					}
					pop();
				}
			}
 		}
	}
	return res;
}

function visible(testVertex) {
	if (prevVertex !== null) {
		var slopePrev = (-(fixedPoint.y - prevVertex.y)) / (-(prevVertex.x - fixedPoint.x));
		var slopeCurr = (-(fixedPoint.y - testVertex.y)) / (-(testVertex.x - fixedPoint.x));

		if (Math.round(slopePrev * 1000) / 1000 === Math.round(slopeCurr * 1000) / 1000) {
			if (!prevVertexVisible) {
				prevVertex = testVertex;
				return false;
			} else {
				if (testVertex.polygon === prevVertex.polygon) {
					if (!testVertex.incidentVertices.includes(prevVertex.number)) {
						if (!visibleSamePolygon(testVertex, prevVertex)) {
							prevVertex = testVertex;
							prevVertexVisible = false;
							return false;
						} else {
							prevVertex = testVertex;
							prevVertexVisible = true;
							return true;
						}
					} else {
						prevVertex = testVertex;
						prevVertexVisible = true;
						return true;
					}
				} else {
					var leftmostEdge = lastMin;

					if (leftmostEdge === null || leftmostEdge === undefined) {
						prevVertex = testVertex;
						prevVertexVisible = true;
						return true;
					}

					var pointA = lineIntersectionPoint(0, 0, maxPoint.x, maxPoint.y, leftmostEdge.vertexA.x - fixedPoint.x, fixedPoint.y - leftmostEdge.vertexA.y, leftmostEdge.vertexB.x - fixedPoint.x, fixedPoint.y - leftmostEdge.vertexB.y);
					var distA = dist(0, 0, pointA.x, pointA.y);
					var roundedA = Math.round(distA * 1000) / 1000;

					var distB = dist(0, 0, testVertex.x - fixedPoint.x, fixedPoint.y - testVertex.y);
					var roundedB = Math.round(distB * 1000) / 1000;

					if (roundedA < roundedB) {
						prevVertex = testVertex;
						prevVertexVisible = false;
						return false;
					} else {
						prevVertex = testVertex;
						prevVertexVisible = true;
						return true;
					}
				}
			}
		} else {
			lastMin = avlTree.findMinimum();
			if (fixedPoint.polygon === testVertex.polygon) {
				if (!fixedPoint.incidentVertices.includes(testVertex.number)) {
					if (!visibleSamePolygon(testVertex, fixedPoint)) {
						prevVertex = testVertex;
						prevVertexVisible = false;
						return false;
					} else {
						prevVertex = testVertex;
						prevVertexVisible = true;
						return true;
					}
				} else {
					prevVertex = testVertex;
					prevVertexVisible = true;
					return true;
				}
			} else {
				if (avlTree._root !== null && avlTree._root !== undefined) {
					var leftmostEdge = avlTree.findMinimum();
					
					if (leftmostEdge === null || leftmostEdge === undefined) {
						prevVertex = testVertex;
						prevVertexVisible = true;
						return true;
					}

					var pointA = lineIntersectionPoint(0, 0, maxPoint.x, maxPoint.y, leftmostEdge.vertexA.x - fixedPoint.x, fixedPoint.y - leftmostEdge.vertexA.y, leftmostEdge.vertexB.x - fixedPoint.x, fixedPoint.y - leftmostEdge.vertexB.y);
					var distA = dist(0, 0, pointA.x, pointA.y);
					var roundedA = Math.round(distA * 1000) / 1000;

					var distB = dist(0, 0, testVertex.x - fixedPoint.x, fixedPoint.y - testVertex.y);
					var roundedB = Math.round(distB * 1000) / 1000;

					if (roundedA < roundedB) {
						prevVertex = testVertex;
						prevVertexVisible = false;
						return false;
					} else {
						prevVertex = testVertex;
						prevVertexVisible = true;
						return true;
					}
				} else {
					prevVertex = testVertex;
					prevVertexVisible = true;
					return true;
				}
			}
		}
	} else {
		lastMin = avlTree.findMinimum();
		if (fixedPoint.polygon === testVertex.polygon) {
			if (!fixedPoint.incidentVertices.includes(testVertex.number)) {
				if (!visibleSamePolygon(testVertex, fixedPoint)) {
					prevVertex = testVertex;
					prevVertexVisible = false;
					return false;
				} else {
					prevVertex = testVertex;
					prevVertexVisible = true;
					return true;
				}
			} else {
				prevVertex = testVertex;
				prevVertexVisible = true;
				return true;
			}
		} else {
			if (avlTree._root !== null && avlTree._root !== undefined) {
				var leftmostEdge = avlTree.findMinimum();

				if (leftmostEdge === null || leftmostEdge === undefined) {
						prevVertex = testVertex;
						prevVertexVisible = true;
						return true;
				}

				var pointA = lineIntersectionPoint(0, 0, maxPoint.x, maxPoint.y, leftmostEdge.vertexA.x - fixedPoint.x, fixedPoint.y - leftmostEdge.vertexA.y, leftmostEdge.vertexB.x - fixedPoint.x, fixedPoint.y - leftmostEdge.vertexB.y);
				var distA = dist(0, 0, pointA.x, pointA.y);
				var roundedA = Math.round(distA * 1000) / 1000;

				var distB = dist(0, 0, testVertex.x - fixedPoint.x, fixedPoint.y - testVertex.y);
				var roundedB = Math.round(distB * 1000) / 1000;

				if (roundedA < roundedB) {
					prevVertex = testVertex;
					prevVertexVisible = false;
					return false;
				} else {
					prevVertex = testVertex;
					prevVertexVisible = true;
					return true;
				}
			} else {
				prevVertex = testVertex;
				prevVertexVisible = true;
				return true;
			}
		}
		lastMin = avlTree.findMinimum();
	}
}

function compareVerticesByAngle(a, b) {
	if (a.angle == b.angle) {
		return a.distance - b.distance;
	} else if (a.angle < b.angle) {
		return -1;
	} else {
		return 1;
	}
}

function compareEdges(a, b) {
	if ((a === null && b === null) || (a === undefined && b === undefined) || (a === null && b === undefined) || (a === undefined && b === null)) {
		return 0;
	}

	if (a === null || a === undefined) {
		return 1;
	}

	if (b === null || b === undefined) {
		return -1;
	}

	if (a.vertexA.x === b.vertexA.x && a.vertexA.y === b.vertexA.y && a.vertexB.x === b.vertexB.x && a.vertexB.y === b.vertexB.y) {
		return 0;
	}

	if (a.vertexA.x === b.vertexB.x && a.vertexA.y === b.vertexB.y && a.vertexB.x === b.vertexA.x && a.vertexB.y === b.vertexA.y) {
		return 0;
	}

	var pointA = lineIntersectionPoint(0, 0, maxPoint.x, maxPoint.y, a.vertexA.x - fixedPoint.x, fixedPoint.y - a.vertexA.y, a.vertexB.x - fixedPoint.x, fixedPoint.y - a.vertexB.y);
	var pointB = lineIntersectionPoint(0, 0, maxPoint.x, maxPoint.y, b.vertexA.x - fixedPoint.x, fixedPoint.y - b.vertexA.y, b.vertexB.x - fixedPoint.x, fixedPoint.y - b.vertexB.y);

	var distA = dist(0, 0, pointA.x, pointA.y);
	var roundedA = Math.round(distA * 1000) / 1000;

	var distB = dist(0, 0, pointB.x, pointB.y);
	var roundedB = Math.round(distB * 1000) / 1000;

	if (roundedA < roundedB) {
		return -1;
	} else if (roundedA > roundedB) {
		return 1;
	} else {
		var point1 = a.vertexA;
		var point2 = a.vertexB;
		var point3 = b.vertexA;
		var point4 = b.vertexB;

		if (point1.x - fixedPoint.x === Math.round(pointA.x) && fixedPoint.y - point1.y === Math.round(pointA.y)) {
			if (point3.x - fixedPoint.x === Math.round(pointA.x) && fixedPoint.y - point3.y === Math.round(pointA.y)) {
				//p1 and p3 same
				var a1 = pow((point2.x - fixedPoint.x) - (point1.x - fixedPoint.x), 2) + pow((fixedPoint.y - point2.y) - (fixedPoint.y - point1.y), 2);
				var b1 = pow((point2.x - fixedPoint.x), 2) + pow((fixedPoint.y - point2.y), 2);
				var c1 = pow((point1.x - fixedPoint.x), 2) + pow((fixedPoint.y - point1.y), 2);
				var cosValueC = (a1 + c1 - b1) / (2 * sqrt(a1) * sqrt(c1));
				var angleC = acos(cosValueC);

				var a2 = pow((point4.x - fixedPoint.x) - (point1.x - fixedPoint.x), 2) + pow((fixedPoint.y - point4.y) - (fixedPoint.y - point1.y), 2);
				var b2 = pow((point4.x - fixedPoint.x), 2) + pow((fixedPoint.y - point4.y), 2);
				var c2 = pow((point1.x - fixedPoint.x), 2) + pow((fixedPoint.y - point1.y), 2);
				var cosValueD = (a2 + c2 - b2) / (2 * sqrt(a2) * sqrt(c2));
				var angleD = acos(cosValueD);

				if (angleC < angleD) {
					return -1;
				} else {
					return 1;
				}
			} else {
				//p1 and p4 same
				var a1 = pow((point2.x - fixedPoint.x) - (point1.x - fixedPoint.x), 2) + pow((fixedPoint.y - point2.y) - (fixedPoint.y - point1.y), 2);
				var b1 = pow((point2.x - fixedPoint.x), 2) + pow((fixedPoint.y - point2.y), 2);
				var c1 = pow((point1.x - fixedPoint.x), 2) + pow((fixedPoint.y - point1.y), 2);
				var cosValueC = (a1 + c1 - b1) / (2 * sqrt(a1) * sqrt(c1));
				var angleC = acos(cosValueC);

				var a2 = pow((point3.x - fixedPoint.x) - (point1.x - fixedPoint.x), 2) + pow((fixedPoint.y - point3.y) - (fixedPoint.y - point1.y), 2);
				var b2 = pow((point3.x - fixedPoint.x), 2) + pow((fixedPoint.y - point3.y), 2);
				var c2 = pow((point1.x - fixedPoint.x), 2) + pow((fixedPoint.y - point1.y), 2);
				var cosValueD = (a2 + c2 - b2) / (2 * sqrt(a2) * sqrt(c2));
				var angleD = acos(cosValueD);
				
				if (angleC < angleD) {
					return -1;
				} else {
					return 1;
				}
			}
		} else {
			if (point3.x - fixedPoint.x === Math.round(pointA.x) && fixedPoint.y - point3.y === Math.round(pointA.y)) {
				//p2 and p3 same
				var a1 = pow((point1.x - fixedPoint.x) - (point2.x - fixedPoint.x), 2) + pow((fixedPoint.y - point1.y) - (fixedPoint.y - point2.y), 2);
				var b1 = pow((point1.x - fixedPoint.x), 2) + pow((fixedPoint.y - point1.y), 2);
				var c1 = pow((point2.x - fixedPoint.x), 2) + pow((fixedPoint.y - point2.y), 2);
				var cosValueC = (a1 + c1 - b1) / (2 * sqrt(a1) * sqrt(c1));
				var angleC = acos(cosValueC);

				var a2 = pow((point4.x - fixedPoint.x) - (point2.x - fixedPoint.x), 2) + pow((fixedPoint.y - point4.y) - (fixedPoint.y - point2.y), 2);
				var b2 = pow((point4.x - fixedPoint.x), 2) + pow((fixedPoint.y - point4.y), 2);
				var c2 = pow((point2.x - fixedPoint.x), 2) + pow((fixedPoint.y - point2.y), 2);
				var cosValueD = (a2 + c2 - b2) / (2 * sqrt(a2) * sqrt(c2));
				var angleD = acos(cosValueD);
				
				if (angleC < angleD) {
					return -1;
				} else {
					return 1;
				}
			} else {
				//p2 and p4 same
				var a1 = pow((point1.x - fixedPoint.x) - (point2.x - fixedPoint.x), 2) + pow((fixedPoint.y - point1.y) - (fixedPoint.y - point2.y), 2);
				var b1 = pow((point1.x - fixedPoint.x), 2) + pow((fixedPoint.y - point1.y), 2);
				var c1 = pow((point2.x - fixedPoint.x), 2) + pow((fixedPoint.y - point2.y), 2);
				var cosValueC = (a1 + c1 - b1) / (2 * sqrt(a1) * sqrt(c1));
				var angleC = acos(cosValueC);

				var a2 = pow((point3.x - fixedPoint.x) - (point2.x - fixedPoint.x), 2) + pow((fixedPoint.y - point3.y) - (fixedPoint.y - point2.y), 2);
				var b2 = pow((point3.x - fixedPoint.x), 2) + pow((fixedPoint.y - point3.y), 2);
				var c2 = pow((point2.x - fixedPoint.x), 2) + pow((fixedPoint.y - point2.y), 2);
				var cosValueD = (a2 + c2 - b2) / (2 * sqrt(a2) * sqrt(c2));
				var angleD = acos(cosValueD);
				
				if (angleC < angleD) {
					return -1;
				} else {
					return 1;
				}
			}
		}
	}
}

function lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
	var uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
	var uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));

	if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    	return true;
	}
	return false;
}

function lineIntersectionPoint(x1, y1, x2, y2, x3, y3, x4, y4) {
	var uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
	var uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));

	var intersectionX = x1 + (uA * (x2 - x1));
	var intersectionY = y1 + (uA * (y2 - y1));

	var returnPoint = {
		x: intersectionX,
		y: intersectionY
	};

	return returnPoint;
}

function visibleSamePolygon(testingVertex, fixedVertex) {
	if (avlTree._root !== null && avlTree._root !== undefined) {
		var leftmostEdge = avlTree.findMinimum();

		if (leftmostEdge === null || leftmostEdge === undefined) {
			var fixedIncidentA = allPoints[fixedVertex.incidentVertices[0]];
			var fixedIncidentB = allPoints[fixedVertex.incidentVertices[1]];
			push();
			translate(fixedVertex.x, fixedVertex.y);
			var v1 = createVector(fixedIncidentA.x - fixedVertex.x, fixedVertex.y - fixedIncidentA.y, 0);
			var v2 = createVector(fixedIncidentB.x - fixedVertex.x, fixedVertex.y - fixedIncidentB.y, 0);
			var v3 = createVector(testingVertex.x - fixedVertex.x, fixedVertex.y - testingVertex.y, 0);

			var crossProduct3 = p5.Vector.cross(v1, v2);

			var crossProduct1 = p5.Vector.cross(v1, v3);
			var crossProduct2 = p5.Vector.cross(v2, v3);

			if (crossProduct1.z >= 0 && crossProduct2.z <= 0) {
				pop();
				return false;
			} else {
				if (crossProduct3.z < 0) {
					if (crossProduct1.z < 0 && crossProduct2.z > 0) {
						pop();
						return true;
					} else {
						pop();
						return false;
					}
				} else {
					pop();
					return true;
				}
			}
		}

		var pointA = lineIntersectionPoint(0, 0, maxPoint.x, maxPoint.y, leftmostEdge.vertexA.x - fixedVertex.x, fixedVertex.y - leftmostEdge.vertexA.y, leftmostEdge.vertexB.x - fixedVertex.x, fixedVertex.y - leftmostEdge.vertexB.y);
		var distA = dist(0, 0, pointA.x, pointA.y);
		var roundedA = Math.round(distA * 1000) / 1000;

		var distB = dist(0, 0, testingVertex.x - fixedVertex.x, fixedVertex.y - testingVertex.y);
		var roundedB = Math.round(distB * 1000) / 1000;

		if (roundedA < roundedB) {
			return false;
		} else {
			var fixedIncidentA = allPoints[fixedVertex.incidentVertices[0]];
			var fixedIncidentB = allPoints[fixedVertex.incidentVertices[1]];
			push();
			translate(fixedVertex.x, fixedVertex.y);
			var v1 = createVector(fixedIncidentA.x - fixedVertex.x, fixedVertex.y - fixedIncidentA.y, 0);
			var v2 = createVector(fixedIncidentB.x - fixedVertex.x, fixedVertex.y - fixedIncidentB.y, 0);
			var v3 = createVector(testingVertex.x - fixedVertex.x, fixedVertex.y - testingVertex.y, 0);

			var crossProduct3 = p5.Vector.cross(v1, v2);

			var crossProduct1 = p5.Vector.cross(v1, v3);
			var crossProduct2 = p5.Vector.cross(v2, v3);

			if (crossProduct1.z >= 0 && crossProduct2.z <= 0) {
				pop();
				return false;
			} else {
				if (crossProduct3.z < 0) {
					if (crossProduct1.z < 0 && crossProduct2.z > 0) {
						pop();
						return true;
					} else {
						pop();
						return false;
					}
				} else {
					pop();
					return true;
				}
			}
		}
	} else {
		var fixedIncidentA = allPoints[fixedVertex.incidentVertices[0]];
		var fixedIncidentB = allPoints[fixedVertex.incidentVertices[1]];
		push();
		translate(fixedVertex.x, fixedVertex.y);
		var v1 = createVector(fixedIncidentA.x - fixedVertex.x, fixedVertex.y - fixedIncidentA.y, 0);
		var v2 = createVector(fixedIncidentB.x - fixedVertex.x, fixedVertex.y - fixedIncidentB.y, 0);
		var v3 = createVector(testingVertex.x - fixedVertex.x, fixedVertex.y - testingVertex.y, 0);

		var crossProduct3 = p5.Vector.cross(v1, v2);

		var crossProduct1 = p5.Vector.cross(v1, v3);
		var crossProduct2 = p5.Vector.cross(v2, v3);

		if (crossProduct1.z >= 0 && crossProduct2.z <= 0) {
			pop();
			return false;
		} else {
			// pop();
			// return true;
			if (crossProduct3.z < 0) {
				if (crossProduct1.z < 0 && crossProduct2.z > 0) {
					pop();
					return true;
				} else {
					pop();
					return false;
				}
			} else {
				pop();
				return true;
			}
		}
	}
}