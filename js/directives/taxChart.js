app.directive('taxChart', ['$window', function($window) {
    return {
        restrict: 'EA',
        link: function(scope, element, attrs) {
            scope.calculateData = function() {
                var brackets = add_brackets(scope.rawBrackets[scope.currentProvince].income, scope.rawBrackets.Federal.income);
                brackets = subtract_brackets(brackets, scope.rawBrackets[scope.currentProvince].personalAmount);
                brackets = subtract_brackets(brackets, scope.rawBrackets.Federal.personalAmount);

                var fed_bracket = subtract_brackets(scope.rawBrackets.Federal.income, scope.rawBrackets.Federal.personalAmount);
                var prov_bracket = subtract_brackets(scope.rawBrackets[scope.currentProvince].income, scope.rawBrackets[scope.currentProvince].personalAmount);


                scope.data = [];

                scope.taxes = [
                    {
                        "name": "Federal",
                        "values": []
                    },
                    {
                        "name": "Provincial",
                        "values": []
                    }
                ];

                scope.effective = [
                    {
                        "name": "Federal",
                        "values": []
                    },
                    {
                        "name": "Provincial",
                        "values": []
                    }
                ];

                scope.marginal = [
                    {
                        "name": "Federal",
                        "values": []
                    },
                    {
                        "name": "Provincial",
                        "values": []
                    }
                ];


                for (var i = 0; i <= 250000; i += 100) {
                    var tax_owed = taxes_owed(i - scope.sliders.deduction, brackets) - scope.sliders.creditRefundable;
                    if (tax_owed > 0) {
                        tax_owed -= scope.sliders.creditNonRefundable;
                        if (tax_owed < 0) {
                            tax_owed = 0;
                        }
                    }
                    var eff_rate = 0;
                    if (i > 0) {
                        eff_rate = tax_owed / i;
                    }
                    var marg_rate = marginal_rate(i - scope.sliders.deduction, brackets);
                    if (tax_owed == 0) {
                        marg_rate = 0;
                    }
                    scope.data.push({
                        "Income": i,
                        "Tax": tax_owed,
                        "Effective Rate": eff_rate,
                        "Marginal Rate": marg_rate
                    });
                    d3.map(scope.taxes, function(d) { return d.name; }).get("Federal").values.push({
                        "income": i,
                        "tax": taxes_owed(i, fed_bracket),
                    });
                    d3.map(scope.taxes, function(d) { return d.name; }).get("Provincial").values.push({
                        "income": i,
                        "tax": taxes_owed(i, prov_bracket),
                    });
                    d3.map(scope.effective, function(d) { return d.name; }).get("Federal").values.push({
                        "income": i,
                        "effective": effective_rate(i, fed_bracket),
                    });
                    d3.map(scope.effective, function(d) { return d.name; }).get("Provincial").values.push({
                        "income": i,
                        "effective": effective_rate(i, prov_bracket),
                    });
                    d3.map(scope.marginal, function(d) { return d.name; }).get("Federal").values.push({
                        "income": i,
                        "marginal": marginal_rate(i, fed_bracket),
                    });
                    d3.map(scope.marginal, function(d) { return d.name; }).get("Provincial").values.push({
                        "income": i,
                        "marginal": marginal_rate(i, prov_bracket),
                    });
                }
            }


            var width = element[0].clientWidth;
            var height = width/2;
            var margins = {
                top: 20,
                right: 120,
                bottom: 70,
                left: 100
            };

            var areaOpacity = "0.3";

            var svg = d3.select(element[0])
                .append("svg")
                .attr("id", "directive")
                .style({
                    "width": width,
                    "height": height
                });

            scope.calculateData();


            var incomeScale = d3.scale.linear()
                .domain([0, d3.max(scope.data, function(d) { return d["Income"]; })])
                .range([margins.left, width - margins.right]);
            var owedScale = d3.scale.linear()
                .domain([0, d3.max(scope.data, function(d) { return d["Tax"]; })])
                .range([height - margins.bottom, margins.top]);
            var rateScale = d3.scale.linear()
                .domain([0, d3.max(scope.data, function(d) { return d["Marginal Rate"]; })])
                .range([height - margins.bottom, margins.top]);

            var incomeAxis = d3.svg.axis()
                    .scale(incomeScale)
                    .tickFormat(d3.format("$s"))
                    .orient("bottom"),
                owedAxis = d3.svg.axis()
                    .scale(owedScale)
                    .tickFormat(d3.format("$s"))
                    .orient("right"),
                rateAxis = d3.svg.axis()
                    .scale(rateScale)
                    .tickFormat(d3.format("%"))
                    .orient("left");

            var taxStack = d3.layout.stack()
                .offset("zero")
                .values(function(d) { return d.values; })
                .x(function(d) { return d.income; })
                .y(function(d) { return d.tax; })

            var effectiveStack = d3.layout.stack()
                .offset("zero")
                .values(function(d) { return d.values; })
                .x(function(d) { return d.income; })
                .y(function(d) { return d.effective; })

            var marginalStack = d3.layout.stack()
                .offset("zero")
                .values(function(d) { return d.values; })
                .x(function(d) { return d.income; })
                .y(function(d) { return d.marginal; })

            var area = d3.svg.area()
                .interpolate("cardinal")
                .x(function(d) { return incomeScale(d.income); })
                .y0(function(d) { return owedScale(d.y0); })
                .y1(function(d) { return owedScale(d.y0 + d.tax); });

            var effectiveArea = d3.svg.area()
                .interpolate("cardinal")
                .x(function(d) { return incomeScale(d.income); })
                .y0(function(d) { return rateScale(d.y0); })
                .y1(function(d) { return rateScale(d.y0 + d.effective); });

            var marginalArea = d3.svg.area()
                .interpolate("cardinal")
                .x(function(d) { return incomeScale(d.income); })
                .y0(function(d) { return rateScale(d.y0); })
                .y1(function(d) { return rateScale(d.y0 + d.marginal); });

            var lineGenTax = d3.svg.line()
                .x(function(d) { return incomeScale(d.Income); })
                .y(function(d) { return owedScale(d["Tax"]); })
                .interpolate("basis");
            var lineGenEff = d3.svg.line()
                .x(function(d) { return incomeScale(d.Income); })
                .y(function(d) { return rateScale(d["Effective Rate"]); })
                .interpolate("basis");
            var lineGenMarg = d3.svg.line()
                .x(function(d) { return incomeScale(d.Income); })
                .y(function(d) { return rateScale(d["Marginal Rate"]); })
                .interpolate("basis");

            var color = d3.scale.category10()
                .domain(["Tax", "Effective Rate", "Marginal Rate"]);


            add_axis();
            draw_areas();
            draw_data();

            var mouseOnGraph = false;
            svg.on("mousemove", update_cursor_line);

            angular.element($window).on('resize', resize);


            function add_axis() {
                svg.append("svg:g")
                    .attr("id", "incomeaxis")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + (height - margins.bottom) + ")")
                    .call(incomeAxis);
                svg.append("svg:g")
                    .attr("id", "owedaxis")
                    .attr("class", "y axis")
                    .attr("transform", "translate(" + (width - margins.right) + ",0)")
                    .call(owedAxis);
                svg.append("svg:g")
                    .attr("id", "rateaxis")
                    .attr("class", "y axis")
                    .attr("transform", "translate(" + (margins.left) + ",0)")
                    .call(rateAxis);

                d3.selectAll("g.x g.tick")
                    .append("line")
                    .classed("grid-line", true)
                    .attr("fill", "none")
                    .attr("stroke", "lightgrey")
                    .attr("stroke-width", "1px")
                    .attr("x1", 0)
                    .attr("y1", 0)
                    .attr("x2", 0)
                    .attr("y2", margins.top + margins.bottom - height);

                d3.selectAll("#rateaxis g.tick")
                    .append("line")
                    .classed("grid-line", true)
                    .attr("fill", "none")
                    .attr("stroke", "lightgrey")
                    .attr("stroke-width", "1px")
                    .attr("x1", 0)
                    .attr("y1", 0)
                    .attr("x2", width - margins.left - margins.right)
                    .attr("y2", 0);

                svg.append("text")
                    .attr("id", "incomelabel")
                    .attr("class", "label")
                    .attr("text-anchor", "middle")
                    .attr("transform", "translate(" + (width/2) + "," + (height - (margins.bottom/3)) + ")")
                    .text("Total Income");
                svg.append("text")
                    .attr("id", "owedlabel")
                    .attr("class", "label")
                    .attr("text-anchor", "middle")
                    .attr("transform", "translate(" + (width - (margins.left/2)) + "," + (height/2) + ")rotate(-90)")
                    .text("Total Taxes Due");
                svg.append("text")
                    .attr("id", "ratelabel")
                    .attr("class", "label")
                    .attr("text-anchor", "middle")
                    .attr("transform", "translate(" + (margins.left/2) + "," + (height/2) + ")rotate(-90)")
                    .text("Rate");
            }


            function update_cursor_line() {
                var [x, y] = d3.mouse(this);
                if (x > margins.left &&
                    x < width - margins.right &&
                    y > margins.top &&
                    y < height - margins.bottom) {
                    if (!mouseOnGraph) {
                        svg.append("line")
                            .attr({
                                "id": "selectionline",
                                "class": "selectionline",
                                "fill": "none",
                                "shape-rendering": "crispEdges",
                                "stroke": "grey",
                                "stroke-width": "2px"
                            });
                        svg.append("circle")
                            .attr("id", "marginalPoint")
                            .attr("r", 4.5);
                        svg.append("circle")
                            .attr("id", "effectivePoint")
                            .attr("r", 4.5);
                        svg.append("circle")
                            .attr("id", "taxPoint")
                            .attr("r", 4.5);
                    }
                    mouseOnGraph = true;

                    scope.currentIncome = incomeScale.invert(x);
                    var dataPoint = scope.data[Math.round(scope.currentIncome/100)];
                    scope.currentTax = dataPoint["Tax"];
                    scope.currentEff = dataPoint["Effective Rate"];
                    scope.currentMarg = dataPoint["Marginal Rate"];

                    var y0 = d3.min([owedScale(scope.currentTax), rateScale(scope.currentEff), rateScale(scope.currentMarg)]);
                    d3.select("#selectionline")
                        .attr({
                            "x1": x,
                            "x2": x,
                            "y1": y0,
                            "y2": height - margins.bottom,
                        });

                    d3.select("#taxPoint")
                        .attr("fill", "white")
                        .attr("stroke", color("Tax"))
                        .attr("cx", x)
                        .attr("cy", owedScale(scope.currentTax));
                    d3.select("#effectivePoint")
                        .attr("fill", "white")
                        .attr("stroke", color("Effective Rate"))
                        .attr("cx", x)
                        .attr("cy", rateScale(scope.currentEff));
                    d3.select("#marginalPoint")
                        .attr("fill", "white")
                        .attr("stroke", color("Marginal Rate"))
                        .attr("cx", x)
                        .attr("cy", rateScale(scope.currentMarg));
                } else {
                    mouseOnGraph = false;
                    d3.select("#selectionline").remove();
                    d3.select("#taxPoint").remove();
                    d3.select("#effectivePoint").remove();
                    d3.select("#marginalPoint").remove();
                }
                scope.$apply();
            };


            function draw_areas() {
                var z = d3.scale.category20c();

                var marginalLayers = marginalStack(scope.marginal);
                svg.selectAll(".marginalLayer")
                    .data(marginalLayers)
                    .enter().append("path")
                    .attr("class", "layer marginalLayer")
                    .attr("d", function(d) { return marginalArea(d.values); })
                    .style("fill", function(d, i) { return color(i); })
                    .style("fill-opacity", "0.3");

                var effectiveLayers = effectiveStack(scope.effective);
                svg.selectAll(".effectiveLayer")
                    .data(effectiveLayers)
                    .enter().append("path")
                    .attr("class", "layer effectiveLayer")
                    .attr("d", function(d) { return effectiveArea(d.values); })
                    .style("fill", function(d, i) { return color(i); })
                    .style("fill-opacity", "0.3");

                var layers = taxStack(scope.taxes);
                svg.selectAll(".taxLayer")
                    .data(layers)
                    .enter().append("path")
                    .attr("class", "layer taxLayer")
                    .attr("d", function(d) { return area(d.values); })
                    .style("fill", function(d, i) { return z(i); })
                    .style("fill-opacity", "0.3");
            }


            function draw_data() {
                svg.append('svg:path')
                    .attr('id', 'marginal')
                    .attr('d', lineGenMarg(scope.data))
                    .attr('stroke', color("Marginal Rate"))
                    .attr('stroke-width', 2)
                    .attr('fill', 'none');
                svg.append('svg:path')
                    .attr('id', 'effective')
                    .attr('d', lineGenEff(scope.data))
                    .attr('stroke', color("Effective Rate"))
                    .attr('stroke-width', 2)
                    .attr('fill', 'none');
                svg.append('svg:path')
                    .attr('id', 'tax')
                    .attr('d', lineGenTax(scope.data))
                    .attr('stroke', color("Tax"))
                    .attr('stroke-width', 2)
                    .attr('fill', 'none');
            }


            function resize() {
                width = element[0].clientWidth;
                height = width/2;

                svg.style({
                    "width": width,
                    "height": height,
                });

                incomeScale
                    .range([margins.left, width - margins.right]);
                owedScale
                    .range([height - margins.bottom, margins.top]);
                rateScale
                    .range([height - margins.bottom, margins.top]);

                d3.select('#incomeaxis')
                    .attr("transform", "translate(0," + (height - margins.bottom) + ")")
                    .call(incomeAxis);
                d3.select('#owedaxis')
                    .attr("transform", "translate(" + (width - margins.right) + ",0)")
                    .call(owedAxis);
                d3.select('#rateaxis')
                    .attr("transform", "translate(" + (margins.left) + ",0)")
                    .call(rateAxis);

                d3.selectAll('g.x g.tick line.grid-line')
                    .attr("y2", margins.top + margins.bottom - height);
                d3.selectAll("#rateaxis g.tick line.grid-line")
                    .attr("x2", width - margins.left - margins.right);

                d3.select('#incomelabel')
                    .attr("transform", "translate(" + (width/2) + "," + (height - (margins.bottom/3)) + ")");
                d3.select('#owedlabel')
                    .attr("transform", "translate(" + (width - (margins.left/2)) + "," + (height/2) + ")rotate(-90)");
                d3.select('#ratelabel')
                    .attr("transform", "translate(" + (margins.left/2) + "," + (height/2) + ")rotate(-90)");

                d3.select('#tax')
                    .attr('d', lineGenTax(scope.data));
                d3.select('#effective')
                    .attr('d', lineGenEff(scope.data));
                d3.select('#marginal')
                    .attr('d', lineGenMarg(scope.data));
            };


            scope.render = function() {
                var transition_time_one = 2000;
                var transition_time_two = 2000;

                var tempTax = lineGenTax(scope.data);
                var tempEff = lineGenEff(scope.data);
                var tempMarg = lineGenMarg(scope.data);

                svg.selectAll(".taxLayer")
                    .data(taxStack(scope.taxes))
                    .transition()
                    .duration(transition_time_one)
                    .attr("d", function(d) { return area(d.values); });

                svg.selectAll(".effectiveLayer")
                    .data(effectiveStack(scope.effective))
                    .transition()
                    .duration(transition_time_one)
                    .attr("d", function(d) { return effectiveArea(d.values); });

                svg.selectAll(".marginalLayer")
                    .data(marginalStack(scope.marginal))
                    .transition()
                    .duration(transition_time_one)
                    .attr("d", function(d) { return marginalArea(d.values); });


                incomeScale
                    .domain([0, d3.max(scope.data, function(d) { return d["Income"]; })]);
                owedScale
                    .domain([0, d3.max(scope.data, function(d) { return d["Tax"]; })]);
                rateScale
                    .domain([0, d3.max(scope.data, function(d) { return d["Marginal Rate"]; })]);


                d3.select('#incomeaxis')
                    .transition()
                    .delay(transition_time_one)
                    .duration(transition_time_two)
                    .call(incomeAxis);

                d3.select('#owedaxis')
                    .transition()
                    .delay(transition_time_one)
                    .duration(transition_time_two)
                    .call(owedAxis);

                d3.select('#rateaxis')
                    .transition()
                    .delay(transition_time_one)
                    .duration(transition_time_two)
                    .call(rateAxis);


                d3.select('#tax')
                    .transition()
                    .duration(transition_time_one)
                    .attr('d', tempTax)
                    .transition()
                    .duration(transition_time_two)
                    .attr('d', lineGenTax(scope.data));

                d3.select('#effective')
                    .transition()
                    .duration(transition_time_one)
                    .attr('d', tempEff)
                    .transition()
                    .duration(transition_time_two)
                    .attr('d', lineGenEff(scope.data));

                d3.select('#marginal')
                    .transition()
                    .duration(transition_time_one)
                    .attr('d', tempMarg)
                    .transition()
                    .duration(transition_time_two)
                    .attr('d', lineGenMarg(scope.data));


                svg.selectAll(".taxLayer")
                    .data(taxStack(scope.taxes))
                    .transition()
                    .delay(transition_time_one)
                    .duration(transition_time_two)
                    .attr("d", function(d) { return area(d.values); });

                svg.selectAll(".effectiveLayer")
                    .transition()
                    .delay(transition_time_one)
                    .duration(transition_time_two)
                    .attr("d", function(d) { return effectiveArea(d.values); });

                svg.selectAll(".marginalLayer")
                    .data(marginalStack(scope.marginal))
                    .transition()
                    .delay(transition_time_one)
                    .duration(transition_time_two)
                    .attr("d", function(d) { return marginalArea(d.values); });
            };

            scope.renderCredits = function() {
                var tempTax = lineGenTax(scope.data);
                var tempEff = lineGenEff(scope.data);
                var tempMarg = lineGenMarg(scope.data);

                d3.select('#tax')
                    .attr('d', tempTax);

                d3.select('#effective')
                    .attr('d', tempEff);

                d3.select('#marginal')
                    .attr('d', tempMarg);
            };

            scope.toggleAreas = function(show) {
                if (show) {
                    svg.selectAll(".marginalLayer")
                        .transition()
                        .delay(600)
                        .duration(200)
                        .style("fill-opacity", areaOpacity);
                    svg.selectAll(".effectiveLayer")
                        .transition()
                        .delay(300)
                        .duration(200)
                        .style("fill-opacity", areaOpacity);
                    svg.selectAll(".taxLayer")
                        .transition()
                        .duration(200)
                        .style("fill-opacity", areaOpacity);
                } else {
                    svg.selectAll(".layer")
                        .transition()
                        .duration(200)
                        .style("fill-opacity", "0.0");
                }
            }
        }
    };
}]);
