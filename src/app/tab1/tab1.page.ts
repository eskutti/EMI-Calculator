import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Chart } from "chart.js";

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {

  @ViewChild("barCanvas") barCanvas: ElementRef;
  @ViewChild("pieCanvas") pieCanvas: ElementRef;
  @ViewChild("lineCanvas") lineCanvas: ElementRef;

  private barChart: Chart;
  private pieChart: Chart;
  private lineChart: Chart;
  emiTenures: any = [];
  slideOpts = {
    initialSlide: 0,
    speed: 400
  };
  calcInfo: any = {
    interestRate: 10,
    loanAmount: 100000,
    tenure: 5
  };
  emiInfo: any = {};
  constructor(public loadingController: LoadingController) { }

  ngOnInit() {
    this.calc();
  }

  onRangeChange(evnt, key) {

    this.calcInfo[key] = evnt.detail.value;
    // this.calc();

  }

  async calc() {

    const loading = await this.loadingController.create({
      message: 'Please wait...',
      duration: 1500
    });
    await loading.present()

    this.emiTenures = [];

    let totalAmountTemp = this.calcInfo.loanAmount;
    let interest = this.calcInfo.interestRate / 1200;
    let term = this.calcInfo.tenure * 12;
    let top = Math.pow((1 + interest), term);
    let bottom = top - 1;
    let ratio = top / bottom;
    let EMI = this.calcInfo.loanAmount * interest * ratio;
    let Total = EMI * term;
    this.emiInfo = {
      loanEmi: EMI,
      totalInterestPayment: (Total - this.calcInfo.loanAmount),
      totalPayment: Total
    }

    for (let i = 0; i < term; i++) {
      let intPaid = totalAmountTemp / 100 * this.calcInfo.interestRate / 12;
      totalAmountTemp -= (this.emiInfo.loanEmi - intPaid);
      this.emiTenures.push({
        idx: i + 1,
        interestPaid: intPaid,
        principalPaid: (this.emiInfo.loanEmi - intPaid),
        balance: totalAmountTemp
      });
    }
    setTimeout(() => this.initCharts());
  }
  initCharts() {
    let labels = [];
    let interests = [];
    let principals = [];
    let totalint = 0;
    let totalPrinc = 0;
    let outStandingAmounts = [];
    let totalAmount = this.calcInfo.loanAmount;

    console.log(outStandingAmounts)
    if (this.calcInfo.tenure === 1) {
      this.emiTenures.forEach(e => {
        totalint = e.interestPaid;
        totalPrinc = e.principalPaid;
        labels.push('M - ' + e.idx);
        interests.push(totalint.toFixed(0));
        principals.push(totalPrinc.toFixed(0));
        totalAmount -= totalPrinc;
        outStandingAmounts.push(totalAmount.toFixed(0));
      });
    } else if (this.calcInfo.tenure === 2) {
      this.emiTenures.forEach((e) => {
        totalint += e.interestPaid;
        totalPrinc += e.principalPaid;
        if (e.idx % 3 === 0) {
          labels.push('Yr-' + (e.idx / 12).toFixed(0) + ', Qtr-' + (e.idx / 3).toFixed(0));
          interests.push(totalint.toFixed(0));
          principals.push(totalPrinc.toFixed(0));
          totalAmount -= totalPrinc;
          outStandingAmounts.push(totalAmount.toFixed(0));
          totalint = 0;
          totalPrinc = 0;
        }
      });
    } else {
      this.emiTenures.forEach((e) => {
        totalint += e.interestPaid;
        totalPrinc += e.principalPaid;
        if (e.idx % 12 == 0) {
          labels.push('Yr-' + (e.idx / 12).toFixed(0));
          interests.push(totalint.toFixed(0));
          principals.push(totalPrinc.toFixed(0));
          totalAmount -= totalPrinc;
          outStandingAmounts.push(totalAmount.toFixed(0));
          totalint = 0;
          totalPrinc = 0;
        }
      });
    }

    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Perincipal',
          backgroundColor: "rgba(0, 179, 0,0.5)",
          data: principals
        }, {
          label: 'Interest',
          backgroundColor: "rgba(255, 26, 26, 0.5)",
          data: interests
        }]
      },
      options: {
        title: {
          display: false,
        },
        tooltips: {
          mode: 'index',
          intersect: false
        },
        responsive: true,
        scales: {
          xAxes: [{
            gridLines: {
              display: false
            },
            stacked: true,
          }],
          yAxes: [{
            gridLines: {
              display: false
            }, ticks: {
              // Include a dollar sign in the ticks
              callback: function (value, index, values) {
                let n = value;
                let d = 2;
                let x = ('' + n).length;
                let p = Math.pow;
                d = p(10, d)
                x -= x % 3
                return Math.round(n * d / p(10, x)) / d + " kMGTPE"[x / 3]
                //return this.abbrNum(value, 2);
              }
            },
            stacked: true,
          }]
        }
      }
    });

    let interestPercentage = this.emiTenures.reduce(function (cnt, o) { return cnt + o.interestPaid; }, 0) / this.emiInfo.totalPayment * 100;
    let totalPaymentPercentage = this.calcInfo.loanAmount / this.emiInfo.totalPayment * 100;
    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: "pie",
      data: {
        labels: ["Interest (%)", "Principal (%)"],
        datasets: [
          {
            label: "# of Votes",
            data: [interestPercentage.toFixed(2), totalPaymentPercentage.toFixed(2)],
            backgroundColor: [
              "rgba(255, 26, 26, 0.5)",
              "rgba(0, 179, 0,0.5)",
            ],
            hoverBackgroundColor: ["#ff1a1a", "#00ff00"]
          }
        ]
      }
    });

    this.lineChart = new Chart(this.lineCanvas.nativeElement, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            data: outStandingAmounts,
            label: "Outstanding principal",
            fill: false,
            lineTension: 0.1,
            backgroundColor: "rgba(75,192,192,0.4)",
            borderColor: "rgba(75,192,192,1)",
            borderCapStyle: "butt",
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: "miter",
            pointBorderColor: "rgba(75,192,192,1)",
            pointBackgroundColor: "#fff",
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "rgba(75,192,192,1)",
            pointHoverBorderColor: "rgba(220,220,220,1)",
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            spanGaps: false
          }
        ]
      },
      options: {
        title: {
          display: false,
        },
        tooltips: {
          mode: 'index',
          intersect: false
        },
        responsive: true,
        scales: {
          xAxes: [{
            gridLines: {
              display: false
            },
            stacked: true,
          }],
          yAxes: [{
            gridLines: {
              display: false
            }, ticks: {
              // Include a dollar sign in the ticks
              callback: function (value, index, values) {
                let n = value;
                let d = 2;
                let x = ('' + n).length;
                let p = Math.pow;
                d = p(10, d)
                x -= x % 3
                return Math.round(n * d / p(10, x)) / d + " kMGTPE"[x / 3]
                //return this.abbrNum(value, 2);
              }
            },
            stacked: true,
          }]
        }
      }
    });
  }

  abbrNum(number, decPlaces) {
    decPlaces = Math.pow(10, decPlaces);
    var abbrev = ["k", "m", "b", "t"];
    for (var i = abbrev.length - 1; i >= 0; i--) {
      var size = Math.pow(10, (i + 1) * 3);
      if (size <= number) {
        number = Math.round(number * decPlaces / size) / decPlaces;
        if ((number == 1000) && (i < abbrev.length - 1)) {
          number = 1;
          i++;
        }
        number += abbrev[i];
        break;
      }
    }
    return number;
  }
}
