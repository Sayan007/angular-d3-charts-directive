import { Directive, ElementRef, HostListener, Input, OnInit, Output, EventEmitter } from '@angular/core';
import * as d3 from 'd3';
interface Config{
  height: number,
  width: number,
  top?: number,
  right?: number,
  bottom?: number,
  left?: number,
  innerRadius?: number,
  length?: number,
  transitionSpeed?: number,
  lineOpacity?: number,
  lineOpacityHover?: number,
  lineStroke?: string,
  lineStrokeHover?: string,
  otherLinesOpacityHover?: number,
  circleOpacity?: number,
  circleOpacityOnLineHover?: number,
  circleRadius?: number,
  circleRadiusHover?: number
  
}

@Directive({
  selector: '[charts]'/*,
  host: {
    '[style.div.toolTip.background-color]': '"yellow"',
  }*/
})
export class ChartDirective implements OnInit{
  /**
   * @param type            String          Type of chart 
   * @param config          Config Object   Chart configuration includes dimensions
   * @param data            Array           Chart data
   * @param color           Array           Chart color
   * @param fontcolor       String          Chart font color
   * @param fontsize        String          Chart font size
   * @param drillthrough    Boolean         Drillthrough is applicable or not
   * @param tooltip         Boolean         Want tooltip or not
   * @param tooltipstyle    Object          Tooltip css
   * @param label           Array           x-Axis labels array for data array
   * @param value           String          y-Axis for data array
   * @param displaylabel    Array           Display name array in tooltip for x-Axis
   * @param displayvalue    String          Display name in tooltip for y-Axis
   * @param showX           Boolean         Show X-Axis or not
   * @param showY           Boolean         show Y-Axis or not
   * @param onDrillthrough  EventEmitter    Sends data to parent component
   */
  @Input('type') type: string; 
  @Input('config') config: Config;
  @Input('data') data: Array<any> = [];
  @Input('color') color: Array<string> = [];
  @Input('fontcolor') fontcolor: string;
  @Input('fontsize') fontsize: any;
  @Input('drillthrough') drillthrough: Boolean = false;
  @Input('tooltip') tooltip: Boolean = false;
  @Input('tooltipstyle') tooltipstyle: Boolean = false;
  @Input('label') label: Array<string> = [];
  @Input('value') value: Array<string> = [];
  @Input('displaylabel') displaylabel: Array<string> = [];
  @Input('displayvalue') displayvalue: Array<string> = [];
  @Input('showX') showX: Boolean = false;
  @Input('showY') showY: Boolean = false;
  @Output() onDrillthrough = new EventEmitter();
  _current: any;
  constructor(private el: ElementRef){}

  ngOnInit() {
    switch(this.type){
      case 'pie': this.pieChart(this.config); break;
      case 'bar': this.barChart(this.config); break;
      case 'donut': this.donutChart(this.config); break;
      case 'disabledDonut': this.disabledDonutChart(this.config); break;
      case 'stacked': this.stackedBarChart(this.config); break;
      case 'grouped': this.groupedChart(this.config); break;
      case 'horizontalBar': this.horizontalBarChart(this.config); break;
      case 'pie3d': this.pie3d(this.config); break;
      case 'line': this.lineChart(this.config); break;
      case 'horizontalStackBar': this.horizontalStackBarChart(this.config); break;
      default: throw new Error('Invalid chart type');
    }
  }

  /**
   * For Pie Chart
   */
  pieChart(config) {
    const self = this;
    var tooltip = this.toolTip();
    var height = config.height,
      width = config.width,
      radius = Math.min(height, width)/2;
    const svg = d3.select(this.el.nativeElement)
      .append("svg")
      .attr("height", height)
      .attr("width", width)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2}) rotate(90)`);
    const color = d3.scaleOrdinal(this.color);

    const pie = d3.pie()
      .value(d => d.count)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    const path = svg.selectAll("path")
      .data(pie(this.data));
      
    path.transition().duration(200).attrTween("d", this.arcTween);

    path.enter().append("path")
      .attr("fill", (d, i) => color(i))
      .attr("d", arc)
      .each(function(d) { this._current = d; })
      .on("click", function(d){
        tooltip.style("display", "none");
        if(self.drillthrough){
          self.onDrillthrough.emit(d.data);
        }
      })
      .on("mousemove", function(d){
        if(self.tooltip){
          tooltip.style("left", d3.event.pageX+10+"px");
          tooltip.style("top", d3.event.pageY-25+"px");
          tooltip.style("display", "block");
          if(self.displaylabel.length > 0){
            tooltip.html(self.displaylabel[0] + ": " + (d.data[self.label[0]])+"<br>"+ self.displayvalue[0] +": " + (d.data[self.value[0]]));
          } else {
            tooltip.html(self.label[0] + ": " + (d.data[self.label[0]])+"<br>"+ self.value[0] +": " + (d.data[self.value[0]]));
          }
        }
      })
      .on("mouseout", function(d){
        if(self.tooltip){
          tooltip.style("display", "none");
        }
      })

    path.enter().append("text")
      .text(function(d){ if(d.data[self.value[0]] > 10) return d.data[self.value[0]] + "%"; })
        .attr("transform", function(d) { return "translate(" +arc.centroid(d)+") rotate(-90)";  })
      .style("text-anchor", "middle")
      .attr("dy", "0.15em")
      .style("fill", (this.fontcolor)? this.fontcolor : "black") 
      .style("font-size", self.fontsize)
  }

  /**
   * For Bar Chart
   */
  barChart(config) {
    const self = this;
    var margin = {
      top: config.top, 
      right: config.right, 
      bottom: config.bottom, 
      left: config.left
    },
    width = config.width - margin.left - margin.right,
    height = config.height - margin.top - margin.bottom;
    var barColor = this.color;
    var tooltip = this.toolTip();

    var svg = d3.select(this.el.nativeElement).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleBand()
      .range([0, width])
      .padding(0.4);
    var y = d3.scaleLinear()
      .range([height, 0]);

    var xAxis = d3.axisBottom(x).tickSize([]).tickPadding(10);
    var yAxis = d3.axisLeft(y).tickSize([5]).tickPadding(5);

    if(!this.showY){
      yAxis = g => g.call(g => g.select(".domain").remove());
    }
    if(!this.showX){
      xAxis = g => g.call(g => g.select(".domain").remove());
    }
    x.domain(this.data.map( d => { return d.year; }));
    y.domain([0, d3.max(this.data,  d => { return d.value; })]);

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);
    svg.append("g")
      .attr("class","y axis")
      .call(yAxis);

    svg.selectAll(".bar")
      .data(this.data)
      .enter().append("rect")
      .attr("class", "bar")
      .on("click", function(d){
        tooltip.style("display", "none");
        if(self.drillthrough){
          self.onDrillthrough.emit(d);
        }
      })
      .on("mousemove", function(d){
        if(self.tooltip){
          tooltip.style("left", d3.event.pageX+10+"px");
          tooltip.style("top", d3.event.pageY-25+"px");
          tooltip.style("display", "block");
          if(self.displaylabel.length > 0){
            tooltip.html(self.displaylabel[0] + ": " + (d[self.label[0]])+"<br>"+ self.displayvalue[0] +": " + (d[self.value[0]]));
          } else {
            tooltip.html(self.label[0] + ": " + (d[self.label[0]])+"<br>"+ self.value[0] +": " + (d[self.value[0]]));
          }
        }
      })
      .on("mouseout", function(d){
        if(self.tooltip){
          tooltip.style("display", "none");
        }
      })
      .style("display", d => { return d[self.value[0]] === null ? "none" : null; })
      .style("fill",  d => { return barColor[0]; })
      .attr("x",  d => { return x(d[self.label[0]]); })
      .attr("width", x.bandwidth())
      .attr("y",  d => { return height; })
      .attr("height", 0)
      .transition()
      .duration(750)
      .delay(function (d, i) {
        return i * 150;
      })
      .attr("y",  d => { return y(d[self.value[0]]); })
      .attr("height",  d => { return height - y(d[self.value[0]]); });

    svg.selectAll(".label")        
      .data(this.data)
      .enter()
      .append("text")
      .attr("class", "label")
      .style("display",  d => { return d[self.value[0]] === null ? "none" : null; })
      .style("font-size", 10)
      .attr("x", ( d => { return x(d[self.label[0]]) + (x.bandwidth() / 2) -7 ; }))
      .style("fill",  d => { (this.fontcolor)? this.fontcolor : "black" })
      .attr("y",  d => { return height; })
      .attr("height", 0)
      .transition()
      .duration(750)
      .delay((d, i) => { return i * 150; })
      .text( d => { return d[self.value[0]]; }) // { return formatPercent(d[self.value[0]]); }
      .attr("y",  d => { return y(d[self.value[0]]) + .1; })
      .attr("dy", "-0.2em"); 
  }

  /**
   * For Donut Chart
   */
  donutChart(config) {
    const self = this;
    var tooltip = this.toolTip();
    const color = d3.scaleOrdinal(this.color);

    var width = this.config.width - this.config.left - this.config.right,
      height = this.config.height - this.config.top - this.config.bottom,
      radius = Math.min(width, height)/2;

		var arc = d3.arc()
    	.outerRadius(radius)
    	.innerRadius(self.config.innerRadius);

		var pie = d3.pie()
	    .sort(null)
	    .value(function(d) {
        return d.value;
	    });

		var svg = d3.select(this.el.nativeElement).append("svg")
	    .attr("width", width)
	    .attr("height", height)
	    .append("g")
	    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var g = svg.selectAll(".arc")
      .data(pie(self.data))
      .enter().append("g")
      .on("click", function(d){
        // alert(d.data.count);
        tooltip.style("display", "none");
        if(self.drillthrough){
          self.onDrillthrough.emit(d.data);
        }
      })
      .on("mousemove", function(d){
        if(self.tooltip){
          tooltip.style("left", d3.event.pageX+10+"px");
          tooltip.style("top", d3.event.pageY-25+"px");
          tooltip.style("display", "block");
          if(self.displaylabel.length > 0){
            tooltip.html(self.displaylabel[0] + ": " + (d.data[self.label[0]])+"<br>"+ self.displayvalue[0] +": " + (d.data[self.value[0]]));
          } else {
            tooltip.html(self.label[0] + ": " + (d.data[self.label[0]])+"<br>"+ self.value[0] +": " + (d.data[self.value[0]]));
          }
        }
      })
      .on("mouseout", function(d){
        if(self.tooltip){
          tooltip.style("display", "none");
        }
      });    

   	g.append("path")
    	.attr("d", arc)
      .style("fill", (d,i) => { return color(i); });

    /*g.append("text")
    	.attr("transform", function(d) {
        var _d = arc.centroid(d);
        _d[0] *= 0.75;	//multiply by a constant factor
        _d[1] *= 1.5;	//multiply by a constant factor
        return "translate(" + _d + ")";
      })
      .attr("dy", "-.10em")
      .style("text-anchor", "middle")
      .style("font-size", 8)
      .text(function(d) {
        if(d.data.value < 8) {
          return '';
        }
        return d.data.value;
      });*/
  }

  /**
   * For Donut Chart
   */
  disabledDonutChart(config) {
    const self = this;
    var tooltip = this.toolTip();
    const color = d3.scaleOrdinal(this.color);

    var width = this.config.width - this.config.left - this.config.right,
      height = this.config.height - this.config.top - this.config.bottom,
      radius = Math.min(width, height)/2;

		var arc = d3.arc()
    	.outerRadius(radius)
    	.innerRadius(self.config.innerRadius+5);

		var pie = d3.pie()
	    .sort(null)
	    .value(function(d) {
        return d.value;
	    });

		var svg = d3.select(this.el.nativeElement).append("svg")
	    .attr("width", width)
	    .attr("height", height)
	    .append("g")
	    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var g = svg.selectAll(".arc")
      .data(pie(self.data))
      .enter().append("g")
      .on("click", function(d){
        // alert(d.data.count);
        tooltip.style("display", "none");
        if(self.drillthrough){
          self.onDrillthrough.emit(d.data);
        }
      })
      .on("mousemove", function(d){
        if(self.tooltip){
          tooltip.style("left", d3.event.pageX+10+"px");
          tooltip.style("top", d3.event.pageY-25+"px");
          tooltip.style("display", "block");
          if(self.displaylabel.length > 0){
            tooltip.html(self.displaylabel[0] + ": " + (d.data[self.label[0]])+"<br>"+ self.displayvalue[0] +": " + (d.data[self.value[0]]));
          } else {
            tooltip.html(self.label[0] + ": " + (d.data[self.label[0]])+"<br>"+ self.value[0] +": " + (d.data[self.value[0]]));
          }
        }
      })
      .on("mouseout", function(d){
        if(self.tooltip){
          tooltip.style("display", "none");
        }
      });    

   	g.append("path")
    	.attr("d", arc)
      .style("fill", 'grey');


    svg.append("text")
      .attr("x", -8)
      .attr("y", -10)
      .style("font-size", "10px")
      .style("fill", "red")
      .html("500");
    svg.append("text")
      .attr("x", -11)
      .attr("y", -1)
      .style("fill", "red")
      .style("font-size", "10px")
      .html("Error");

    svg.append("text")
      .attr("x", -15)
      .attr("y", 15)
      .style("cursor", "pointer")
      .style("font-size", "11px")
      .style("fill", "blue")
      .on("click", function(d){
        alert("Reloaded")        
      })
      .html('Reload')
      

    /*g.append("text")
    	.attr("transform", function(d) {
        var _d = arc.centroid(d);
        _d[0] *= 0.75;	//multiply by a constant factor
        _d[1] *= 1.5;	//multiply by a constant factor
        return "translate(" + _d + ")";
      })
      .attr("dy", "-.10em")
      .style("text-anchor", "middle")
      .style("font-size", 8)
      .text(function(d) {
        if(d.data.value < 8) {
          return '';
        }
        return d.data.value;
      });*/
  }

  /**
   * For Grouped Chart
   */
  groupedChart(config) {
    const self = this;
    var height = config.height,
      width = config.width,
      margin = {
        top: config.top,
        bottom: config.bottom,
        left: config.left,
        right: config.right
      },
      keys = this.label.slice(1),
      groupKey = this.label[0],
      color = d3.scaleOrdinal().range(this.color),
      x0 = d3.scaleBand()
        .domain(this.data.map(d => d[groupKey]))
        .rangeRound([margin.left, width - margin.right])
        .paddingInner(0.1),
      x1 = d3.scaleBand()
        .domain(keys)
        .rangeRound([0, x0.bandwidth()])
        .padding(0.13),
      y = d3.scaleLinear()
        .domain([0, d3.max(this.data, d => d3.max(keys, key => d[key]))]).nice()
        .rangeRound([height - margin.bottom, margin.top]),
      xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x0).tickSizeOuter(0)),
      yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(null, "s"))
        .call(g => g.select(".tick:last-of-type text").clone()
          .attr("x", -15)
          .attr("y", -15)
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text(this.displayvalue[0])),
      legend = svg => {
        const g = svg
          .attr("transform", `translate(${width-margin.right/2},0)`)
          .attr("text-anchor", "end")
          .attr("font-family", "sans-serif")
          .attr("font-size", 10)
          .selectAll("g")
          .data(color.domain().slice().reverse())
          .join("g")
          .attr("transform", (d, i) => `translate(0,${i * 11})`);
        g.append("rect")
          .attr("x", -19)
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", color);
        g.append("text")
          .attr("x", 30)
          .attr("y", 5)
          .attr("dy", "0.3em")
          .text(d => d);
      };
      var tooltip = this.toolTip();
      if(!this.showY){
        yAxis = g => g.call(g => g.select(".domain").remove());
      }
      if(!this.showX){
        xAxis = g => g.call(g => g.select(".domain").remove());
      }
      const svg = d3.select(this.el.nativeElement).append("svg")
        .attr("width", width)
	      .attr("height", height);
      svg.append("g")
        .selectAll("g")
        .data(this.data)
        .join("g")
        .attr("transform", d => `translate(${x0(d[groupKey])},0)`)
        .selectAll("rect")
        .data(d => self.label.map(key => ({'group': d[self.displaylabel[0]],'key': key, 'value': d[key]})))
        .join("rect")
        .attr("x", d => x1(d.key))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => y(0) - y(d.value))
        .attr("fill", d => color(d.key))
        .on("click", function(d){
          tooltip.style("display", "none");
          if(self.drillthrough){
            self.onDrillthrough.emit(d);
          }
        })
        .on("mousemove", function(d,i){
          if(self.tooltip){
            tooltip.style("left", d3.event.pageX+10+"px");
            tooltip.style("top", d3.event.pageY-25+"px");
            tooltip.style("display", "block");
            if(self.displaylabel.length > 0){
              tooltip.html(self.displaylabel[0]+": "+ d['group']+"<br>"+ self.displayvalue[0] +": " + d.value);
            } else {
              tooltip.html(d.key +": " + d.value);
            }
          }
        })
        .on("mouseout", function(d){
          if(self.tooltip){
            tooltip.style("display", "none");
          }
        });
      svg.append("g")
        .call(xAxis);
      svg.append("g")
        .call(yAxis);
      svg.append("g")
        .call(legend);
  }

  /**
   * For Horizontal Bar Chart
   */
  horizontalBarChart(config){
    const self = this;
    var tooltip = this.toolTip();
    var margin = {
      top: config.top, 
      right: config.right, 
      bottom: config.bottom, 
      left: config.left
    },
    width = config.width - margin.left - margin.right,
    height = config.height - margin.top - margin.bottom,
    y = d3.scaleBand()
      .range([height, 0])
      .padding(0.1),
    x = d3.scaleLinear()
      .range([0, width]);

    var svg = d3.select(this.el.nativeElement).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.data.forEach(function(d) {
      d[self.value[0]] = +d[self.value[0]];
    });
    x.domain([0, d3.max(
      self.data, function(d){ 
        return d[self.value[0]]; 
      }
    )]);
    y.domain(self.data.map(function(d) { 
      return d.salesperson; 
    }));
    svg.selectAll(".bar")
      .data(this.data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("fill", this.color[0])
      .attr("width", function(d) {return x(d[self.value[0]]); } )
      .attr("y", function(d) { return y(d[self.label[0]]); })
      .attr("height", y.bandwidth())
      .on("click", function(d){
        tooltip.style("display", "none");
        if(self.drillthrough){
          self.onDrillthrough.emit(d);
        }
      })
      .on("mousemove", function(d){
        if(self.tooltip){
          tooltip.style("left", d3.event.pageX+10+"px");
          tooltip.style("top", d3.event.pageY-25+"px");
          tooltip.style("display", "block");
          if(self.displaylabel.length > 0){
            tooltip.html(self.displaylabel[0] + ": " + (d[self.label[0]])+"<br>"+ self.displayvalue[0] +": " + (d[self.value[0]]));
          } else {
            tooltip.html(self.label[0] + ": " + (d[self.label[0]])+"<br>"+ self.value[0] +": " + (d[self.value[0]]));
          }
        }
      })
      .on("mouseout", function(d){
        if(self.tooltip){
          tooltip.style("display", "none");
        }
      });

    if(this.showX){
      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    }

    if(this.showY){
      svg.append("g")
        .call(d3.axisLeft(y));
    }
  }

  /**
   * For 3D Pie Chart
   */
  pie3d(config){
    var id = "pie3d_" + (document.querySelectorAll(".slices").length + 1);
    const self = this;
    var height = config.height,
      width = config.width,
      length = config.length,
      radius = Math.min(height - 50, width -50 )/2,
      x = radius+20,
      y = radius,
      rx = radius+20,
      ry = radius;
    const color = d3.scaleOrdinal(this.color);
    var tooltip = this.toolTip();
    var pieTop = function(d, rx, ry, ir ){
      if(d.endAngle - d.startAngle == 0 ) {
        return "M 0 0";
      }
      var sx = rx*Math.cos(d.startAngle),
        sy = ry*Math.sin(d.startAngle),
        ex = rx*Math.cos(d.endAngle),
        ey = ry*Math.sin(d.endAngle);
        
      var ret =[];
      ret.push("M",sx,sy,"A",rx,ry,"0",(d.endAngle-d.startAngle > Math.PI? 1: 0),"1",ex,ey,"L",ir*ex,ir*ey);
      ret.push("A",ir*rx,ir*ry,"0",(d.endAngle-d.startAngle > Math.PI? 1: 0), "0",ir*sx,ir*sy,"z");
      return ret.join(" ");
	  }

    var pieOuter = function(d, rx, ry, h ){
      var startAngle = (d.startAngle > Math.PI ? Math.PI : d.startAngle);
      var endAngle = (d.endAngle > Math.PI ? Math.PI : d.endAngle);
      var sx = rx*Math.cos(startAngle),
        sy = ry*Math.sin(startAngle),
        ex = rx*Math.cos(endAngle),
        ey = ry*Math.sin(endAngle);
        
      var ret =[];
      ret.push("M",sx,h+sy,"A",rx,ry,"0 0 1",ex,h+ey,"L",ex,ey,"A",rx,ry,"0 0 0",sx,sy,"z");
      return ret.join(" ");
    }

    var pieInner = function(d, rx, ry, h, ir ){
      var startAngle = (d.startAngle < Math.PI ? Math.PI : d.startAngle);
      var endAngle = (d.endAngle < Math.PI ? Math.PI : d.endAngle);
      
      var sx = ir*rx*Math.cos(startAngle),
        sy = ir*ry*Math.sin(startAngle),
        ex = ir*rx*Math.cos(endAngle),
        ey = ir*ry*Math.sin(endAngle);

      var ret =[];
      ret.push("M",sx, sy,"A",ir*rx,ir*ry,"0 0 1",ex,ey, "L",ex,h+ey,"A",ir*rx, ir*ry,"0 0 0",sx,h+sy,"z");
      return ret.join(" ");
    }

    var getPercent = function(d){
		  return (d.endAngle-d.startAngle > 0.2 ? 
				Math.round(1000*(d.endAngle-d.startAngle)/(Math.PI*2))/10+'%' : '');
	  }	

    var draw = function(data, x, y, rx, ry, h, ir){
      var _data = d3.pie()
        .sort(null)
        .value(function(d) {
          return d.value;
        })(data);
      var slices = d3.select(self.el.nativeElement)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + x + "," + y + ")")
        .attr("class", "slices")
        .attr("id", id);
      
      slices.selectAll(".topSlice")
        .data(_data)
        .enter()
        .append("path")
        .attr("class", "topSlice")
        .attr("id", function(d){
          return "top"+d.data[self.label[0]]
        })
        .on("click", function(d){
          tooltip.style("display", "none");
          if(self.drillthrough){
            self.onDrillthrough.emit(d.data);
          }
        })
        .on("mousemove", function(d){
          d3.selectAll("#"+id+" .topSlice")
            .style("opacity", 0.5);
          d3.selectAll("#"+id+" .outerSlice")
            .style("opacity", 0.5);
          d3.selectAll("#"+id+" #top"+d.data[self.label[0]])
            .style("opacity", 1)
          d3.selectAll("#"+id+" #outer"+d.data[self.label[0]])
            .style("opacity", 1)
          if(self.tooltip){
            tooltip.style("left", d3.event.pageX+10+"px");
            tooltip.style("top", d3.event.pageY-25+"px");
            tooltip.style("display", "block");
            if(self.displaylabel.length > 0){
              tooltip.html(self.displaylabel[0] + ": " + (d.data[self.label[0]])+"<br>"+ self.displayvalue[0] +": " + (d.data[self.value[0]]));
            } else {
              tooltip.html(self.label[0] + ": " + (d.data[self.label[0]])+"<br>"+ self.value[0] +": " + (d.data[self.value[0]]));
            }
          }
        })
        .on("mouseout", function(d){
          d3.selectAll("#"+id+" .topSlice")
            .style("opacity", 1);
          d3.selectAll("#"+id+" .outerSlice")
            .style("opacity", 1);
          if(self.tooltip){
            tooltip.style("display", "none");
          }
        })
        .style("fill", (d, i) => color(i))
        .style("stroke", (d, i) => color(i))
        .attr("d",function(d){ 
          return pieTop(d, rx, ry, ir);
        })
        .each(function(d){
          this._current=d;
        });
      
      slices.selectAll(".outerSlice")
        .data(_data)
        .enter()
        .append("path")
        .attr("class", "outerSlice")
        .attr("id", function(d){
          return "outer"+d.data[self.label[0]]
        })
        .style("fill", (d,i) => {
          return d3.hsl(self.color[i]).darker(0.7)
        })
        .attr("d",function(d){ 
          return pieOuter(d, rx-.5,ry-.5, h);
        })
        .each(function(d){
          this._current=d;
        });

      slices.selectAll(".percent")
        .data(_data)
        .enter()
        .append("text")
        .attr("class", "percent")
        .attr("x",function(d){ 
          return 0.6*rx*Math.cos(0.5*(d.startAngle+d.endAngle));
        })
        .attr("y",function(d){ 
          return 0.6*ry*Math.sin(0.5*(d.startAngle+d.endAngle));
        })
        .text(getPercent)
        .style("fill", self.fontcolor)
        .style("font-size", self.fontsize)
        .each(function(d){
          this._current=d;
        });		
    }

    draw(this.data, x, y, rx , ry , length, 0);

  }

  /**
   * For Stack Bar Chart
   */
  stackedBarChart(config){
    var tooltip = this.toolTip();
    const self = this;
    var legendSvg = d3.select(this.el.nativeElement).append("svg"),
      svg = d3.select(this.el.nativeElement).append("svg"),
		  margin = {
        top: config.top, 
        left: config.left, 
        bottom: config.bottom, 
        right: config.right
      },
      transitionSpeed = config.transitionSpeed,
		  width = config.width - margin.left - margin.right,
		  height = config.height - margin.top - margin.bottom,
      color = d3.scaleOrdinal().range(this.color);
    var states = [];
    for(let i = 0; i < this.data.length; i++){
      if(states.indexOf(this.data[i][this.label[0]]) === -1){
        states.push(this.data[i][this.label[0]]);
      }
    }
    var keys = this.label.slice(1);
    var x = d3.scaleBand()
      .range([margin.left, width - margin.right])
      .padding(0.1)
  	var y = d3.scaleLinear()
	  	.rangeRound([height - margin.bottom, margin.top])
	  var xAxis = svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .attr("class", "x-axis")
	  var yAxis = svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .attr("class", "y-axis")
      .remove();
  	var z = d3.scaleOrdinal()
      .range(this.color)
      .domain(keys);
    this.data.forEach(function(d) {
			d.total = d3.sum(keys, k => +d[k])
			return d
		})
    
    y.domain([0, d3.max(this.data, d => d3.sum(keys, k => +d[k]))]).nice();
		svg.selectAll(".y-axis").transition().duration(transitionSpeed)
			.call(d3.axisLeft(y).ticks(null, "s"))
		x.domain(this.data.map(d => d[this.label[0]]));
		svg.selectAll(".x-axis").transition().duration(transitionSpeed)
			.call(d3.axisBottom(x).tickSizeOuter(0))
		var group = svg.selectAll("g.layer")
			.data(d3.stack().keys(keys)(self.data), d => d.key)
		group.exit().remove()
		group.enter().append("g")
			.classed("layer", true)
			.attr("fill", d => z(d.key));
    
		var bars = svg.selectAll("g.layer").selectAll("rect")
			.data(d => d, e => e.data[self.label[0]])
		bars.exit().remove()
		bars.enter().append("rect")
			.attr("width", x.bandwidth())
      .on("click", function(d, i){
        tooltip.style("display", "none");
        console.log(d.keys);
        if(self.drillthrough){
          self.onDrillthrough.emit({
            'key': self.data[i][self.label[0]],
            'value': d[1]-d[0]
          });
        }
      })
      .on("mousemove", function(d, i){
        if(self.tooltip){
          tooltip.style("left", d3.event.pageX+10+"px");
          tooltip.style("top", d3.event.pageY-25+"px");
          tooltip.style("display", "block");
          if(self.displaylabel.length > 0){
            tooltip.html(self.displaylabel[0] + ": " + (self.data[i][self.label[0]])+"<br>"+ self.displayvalue[0] +": " + (d[1]-d[0]));
          } else {
            tooltip.html(self.label[0] + ": " + (self.data[i][self.label[0]])+"<br>"+ self.value[0] +": " + (d[1]-d[0]));
          }
        }
      })
      .on("mouseout", function(d){
        if(self.tooltip){
          tooltip.style("display", "none");
        }
      })
			.merge(bars)
		  .transition().duration(transitionSpeed)
			.attr("x", d => x(d.data[self.label[0]]))
			.attr("y", d => y(d[1]))
			.attr("height", d => y(d[0]) - y(d[1]))

		var text = svg.selectAll(".text")
			.data(this.data, d => d[self.label[0]]);
      text.exit().remove()
      text.enter().append("text")
			.attr("class", "text")
			.attr("text-anchor", "middle")
      .style("font-size", self.fontsize)
      .style("fill", self.fontcolor)
			.merge(text)
		  .transition().duration(transitionSpeed)
			.attr("x", d => x(d[self.label[0]]) + x.bandwidth() / 2)
			.attr("y", d => y(d.total) - 5)
			.text(d => d.total);

    legendSvg.attr("width", keys.length * 70)
      .attr("height", 40)
      .style("font-size", self.fontsize)
      .style("fill", self.fontcolor)
      .style("margin-left", `${margin.left*3}px`)
      .style("margin-top", `${margin.top/2}px`)
      .style("text-transform", "capitalize")
      .style("display", "block")
      .attr("text-align", "center");
  
    const g = legendSvg.append("g")
      .selectAll("g")
      .data(keys)
      .join("g")
        .attr("transform", (d, i) => `translate(${i * 40},0)`);

    g.append("rect")
      .attr("width", 40)
      .attr("height", 10)
      .attr("fill", (d, i) => {
        return color(i)
      })
    g.append("text")
      .attr("x", 10)
      .attr("y", 32)
      .attr("dy", "-0.5em")
      .text((d,i) => keys[i]);
  }

  /**
   * For Line Chart
   */
  lineChart(config){
    const self = this;
    var tooltip = this.toolTip();
    var margin = {top: config.top, right: config.right, bottom: config.bottom, left: config.left},
      width = config.width - margin.left - margin.right,
      height = config.height - margin.top - margin.bottom;
    var duration = 250;
    var color = d3.scaleOrdinal().range(this.color);

    var lineOpacity = config.lineOpacity;
    var lineOpacityHover = config.lineOpacityHover;
    var otherLinesOpacityHover = config.otherLinesOpacityHover;
    var lineStroke = config.lineStroke;
    var lineStrokeHover = config.lineStrokeHover;
    
    var circleOpacity = config.circleOpacity;
    var circleOpacityOnLineHover = config.circleOpacityOnLineHover;
    var circleRadius = config.circleRadius;
    var circleRadiusHover = config.circleRadiusHover;
    

    var svg = d3.select(this.el.nativeElement).append("svg")
      .attr("width", width+ "px")
      .attr("height", (height+margin.top+margin.bottom)+"px")
      .append('g')
      .attr("width", (width+margin.left+margin.right)+"px")
      .attr("height", (height+margin.top+margin.bottom)+"px")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    /* Format Data */
    var parseDate = d3.timeParse("%Y-%m-%d");
    var formatDate = d3.timeFormat("%a %d, %b");
    var filteredData = this.data;
    filteredData.forEach(function(d) { 
      d.values.forEach(function(d) {
      d.date = parseDate(d.date);
      d.count = +d.count;    
      });
    });

    /*scale*/
    var xScale = d3.scaleTime()
      .domain(d3.extent(filteredData[0].values, d => d.date))
      .range([5, width-(margin.left+margin.right)]);
    
    var yScale = d3.scaleLinear()
      .domain([0, 150])
      .range([height-(margin.top+margin.bottom), 0]);
    var line = d3.line()
      .x(d => xScale(d["date"]))
      .y(d => yScale(d["count"]));
    let lines = svg.append('g')
      .attr('class', 'lines');

    lines.selectAll('.line-group')
      .data(filteredData).enter()
      .append('g')
      .attr('class', 'line-group')  
      .on("mouseover", function(d, i) {
        svg.append("text")
          .attr("class", "title-text")
          .style("fill", () => {
            if(d.ticketname == "P1" || d.ticketname == "P2"){
              return "#DB4041"; 
            } else if(d.ticketname == "P3") {
              return "#FFBF00";
            } else if(d.ticketname == "P4") {
              return "#009900";
            }
          })        
        .text("Ticket Name: " + d.ticketname + "----Category: "+ d.category)
        .attr("text-anchor", "middle")
        .attr("x", (width-(margin.left+margin.right))/2)
        .attr("y", 5);
      })
      .on("mouseout", function(d) {
        svg.select(".title-text").remove();
      })
      .append('path')
      .attr('class', 'line')
      .style("stroke-width", 2)
      .style("fill","none")  
      .attr('d', d => line(d.values))
      .style('stroke', (d,i) => {
        if(d.ticketname == "P1" || d.ticketname == "P2"){
          return "#DB4041"; 
        } else if(d.ticketname == "P3") {
          return "#FFBF00";
        } else if(d.ticketname == "P4") {
          return "#009900";
        } 
      }) 
      .style('opacity', lineOpacity)
      .on("mouseover", function(d) {
        d3.selectAll('.line')
          .style('opacity', otherLinesOpacityHover);
        d3.selectAll('.circle')
          .style('opacity', circleOpacityOnLineHover);
        d3.select(this)
          .style('opacity', lineOpacityHover)
          .style("stroke-width", lineStrokeHover)
          .style("cursor", "pointer");
      })
      .on("mouseout", function(d) {
        d3.selectAll(".line")
          .style('opacity', lineOpacity);
        d3.selectAll('.circle')
          .style('opacity', circleOpacity);
        d3.select(this)
          .style("stroke-width", lineStroke)
          .style("cursor", "none");
      });
    
    lines.selectAll("circle-group")
      .data(filteredData).enter()
      .append("g")
      .style("fill", (d, i) => {
        if(d.ticketname == "P1" || d.ticketname == "P2"){
          return "#DB4041"; 
        } else if(d.ticketname == "P3") {
          return "#FFBF00";
        } else if(d.ticketname == "P4") {
          return "#009900";
        } 
      }) 
      .selectAll("circle")
      .data(d => d.values).enter()
      .append("g")
      .attr("class", "circle")  
      .on("mouseover", function(d) {
        d3.select(this)     
          .style("cursor", "pointer")
          .append("text")
          .attr("class", "text")
          .text("Date: " + d.date.getFullYear() + "-" + (d.date.getMonth()+1) + "-" + d.date.getDate() + "---" + "Count: " + d.count)
          .attr("x", d => xScale(d.date) + 5)
          .attr("y", d => yScale(d.count) - 10);
        })
      .on("mouseout", function(d) {
        d3.select(this)
        .style("cursor", "none")  
        .transition()
        .duration(duration)
        .selectAll(".text").remove();
      })
      .append("circle")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.count))
      .attr("r", circleRadius)
      .style('opacity', circleOpacity)
      .on("mouseover", function(d) {
        d3.select(this)
          .transition()
          .duration(duration)
          .attr("r", circleRadiusHover);
        })
      .on("mouseout", function(d) {
        d3.select(this) 
          .transition()
          .duration(duration)
          .attr("r", circleRadius);  
      });
    
    var xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(function(d,i){ return formatDate(d) });;
    var yAxis = d3.axisLeft(yScale).ticks(5);
    
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${height-(margin.top+margin.bottom)})`)
      .call(xAxis)
      .append('text')
      .attr("x", width-(margin.left+margin.right))
      .attr("y", -5)
      .attr("fill", "#000")
      .text("Days");

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append('text')
      .attr("y", 15)
      .attr("transform", "rotate(-90)")
      .attr("fill", "#000")
      .text("Ticket Count");

  }

  /**
   * For Horizontal Stack Bar Chart
   */
  horizontalStackBarChart(config){
    const self = this;
    var tooltip = this.toolTip();
    var margin = {top: config.top, right: config.right, bottom: config.bottom, left: config.left},
    width = config.width - margin.left - margin.right,
    height = config.height - margin.top - margin.bottom;

   var svg = d3.select(this.el.nativeElement).append("svg")
      .attr("width", width+ "px")
      .attr("height", (height+margin.top+margin.bottom)+"px")
      .append('g')
      .attr("width", (width+margin.left+margin.right)+"px")
      .attr("height", (height+margin.top+margin.bottom)+"px")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
    var y = d3.scaleBand()			// x = d3.scaleBand()	
      .rangeRound([0, height])	// .rangeRound([0, width])
      .paddingInner(0.05)
      .align(0.1);
    var x = d3.scaleLinear()		// y = d3.scaleLinear()
      .rangeRound([0, width]);	// .rangeRound([height, 0]);

    var z = d3.scaleOrdinal()
      .range(["#ff0000", "#ffbf00", "#008000"]);
    var labels = ["State", "<5", "5 - 13", "14 - 17"];
    // var keys = ['Under 5 Years','5 to 13 Years','14 to 17 Years','18 to 24 Years','25 to 44 Years','45 to 64 Years','65 Years and Over'];
    var keys = labels.slice(1);
    // data.sort(function(a, b) { return b.total - a.total; });
    var data = this.data;
      y.domain(data.map(function(d) { return d.State; }));					// x.domain...
      x.domain([0, 3000]).nice();	// y.domain...
      z.domain(keys);

    svg.append("g")
      .selectAll("g")
      .data(d3.stack().keys(keys)(data))
      .enter().append("g")
          .attr("fill", function(d) { return z(d.key); })
      .selectAll("rect")
      .data(function(d) { return d; })
      .enter().append("rect")
      .attr("y", function(d) { return y(d.data.State); })	    //.attr("x", function(d) { return x(d.data.State); })
      .attr("x", function(d) { return x(d[0]); })			    //.attr("y", function(d) { return y(d[1]); })	
      .attr("width", function(d) { return x(d[1]) - x(d[0]); })	//.attr("height", function(d) { return y(d[0]) - y(d[1]); })
      .attr("height", y.bandwidth());						    //.attr("width", x.bandwidth());	

    svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0,0)") 						//  .attr("transform", "translate(0," + height + ")")
      .call(d3.axisLeft(y));									//   .call(d3.axisBottom(x));

    svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0,"+height+")")				// New line
      .call(d3.axisBottom(x).ticks(null, "s"))					//  .call(d3.axisLeft(y).ticks(null, "s"))
      .append("text")
      .attr("y", 2)												//     .attr("y", 2)
      .attr("x", x(x.ticks().pop()) + 0.5) 						//     .attr("y", y(y.ticks().pop()) + 0.5)
      .attr("dy", "0.32em")										//     .attr("dy", "0.32em")
      .attr("fill", "#000")
      .attr("font-weight", "bold")
      .attr("text-anchor", "start")
      .text("Population")
      .attr("transform", "translate("+ (-width) +",-10)");   	// Newline

    var legend = svg => {
    const g = svg
      .attr("transform", `translate(${width-margin.right/2},0)`)
      .attr("text-anchor", "end")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .selectAll("g")
      .data(keys.slice().reverse())
      .enter().append("g")
      .attr("transform", (d, i) => `translate(0,${i * 11})`);
    g.append("rect")
      .attr("x", -19)
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", z);
    g.append("text")
      .attr("x", 30)
      .attr("y", 5)
      .attr("dy", "0.3em")
      .text(d => d);
    };
    svg.append("g")
      .call(legend);
  }
  /**
   * ARC Tween fror Pie Chart
   */
  private arcTween(a) {
    const i = d3.interpolate(this._current, a);
    this._current = i(1);
    return (t) => d3.arc()
      .innerRadius(0)
      .outerRadius(i(t));
  }

  /**
   * Tooltip
   */
  private toolTip(){
    var tooltip = d3.select("body").append("div").attr("class", "toolTip");
    for(let key in this.tooltipstyle){
      tooltip.style(key, this.tooltipstyle[key]);
    }
    return tooltip;
  }
}