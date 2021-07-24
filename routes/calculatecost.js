var RequiredSoftware = [0.75, 0.88, 1, 1.15, 1.4];
var SizeofProjectDatabase = [0.94, 1, 1.08, 1.16];
var ComplexityofTheProject = [0.7, 0.85, 1, 1.15, 1.3];
var PerformanceRestriction = [1, 1.11, 1.3];
var MemoryRestriction = [1, 1.06, 1.21];
var VirtualMachineEnvironment = [0.87, 1, 1.15, 1.3];
var RequiredTurnaboutTime = [0.94, 1, 1.07, 1.15];
var AnalysisCapability = [1.46, 1.19, 1, 0.86, 0.71];
var ApplicationExperience = [1.29, 1.13, 1, 0.91, 0.82];
var SoftwareEngineerCapability = [1.42, 1.17, 1, 0.86, 0.7];
var VirtualMachineExperience = [1.21, 1.1, 1, 0.9];
var ProgrammingExperience = [1.14, 1.07, 1, 0.95];
var SoftwareEngineeringMethods = [1.24, 1.1, 1, 0.91, 0.82];
var UseofSoftwareTools = [1.24, 1.1, 1, 0.91, 0.83];
var DevelopmentTime = [1.23, 1.08, 1, 1.04, 1.1];
var ProjectType = ["Organic", "Semi-Detached", "Embeded"];
var staticValues = [
  [2.4, 1.05, 2.5, 0.38],
  [3, 1.12, 2.5, 0.35],
  [3.6, 1.2, 2.5, 0.32],
];
var scale = ["Very-Low", "Low", "Nominal", "High", "Very-High"];
var scale2 = ["Nominal", "High", "Very-High"];
var scale3 = ["Low", "Nominal", "High", "Very-High"];

function findAndReplace(object, value, replacevalue) {
  for (var x in object) {
    if (typeof object[x] == typeof {}) {
      findAndReplace(object[x], value, replacevalue);
    }
    if (object[x] == value) {
      object[x] = replacevalue;
      // break; // uncomment to stop after first replacement
    }
  }
}

calculatecost = (req,res)=>{
    try {
      var val = req.query.ProjectType.toString();
      var type = ProjectType.indexOf(val);

      var a = staticValues[type][0];
      var b = staticValues[type][1];
      var c = staticValues[type][2];
      var d = staticValues[type][3];
      var eaf = 1;
      updated = req.query;
      findAndReplace(updated, "None", "Nominal");

      eaf =
        eaf * RequiredSoftware[scale.indexOf(updated.Requirements.toString())];
      eaf =
        eaf *
        SizeofProjectDatabase[scale3.indexOf(updated.Database.toString())];
      eaf =
        eaf *
        ComplexityofTheProject[scale.indexOf(updated.Complexity.toString())];

      eaf =
        eaf *
        PerformanceRestriction[scale2.indexOf(updated.Performance.toString())];
      eaf = eaf * MemoryRestriction[scale2.indexOf(updated.Memory.toString())];
      eaf =
        eaf *
        VirtualMachineEnvironment[
          scale3.indexOf(updated.vmenvironment.toString())
        ];
      eaf =
        eaf *
        RequiredTurnaboutTime[scale3.indexOf(updated.TurnaboutTime.toString())];

      eaf =
        eaf *
        AnalysisCapability[
          scale.indexOf(updated.AnalysisCapability.toString())
        ];
      eaf =
        eaf *
        ApplicationExperience[scale.indexOf(updated.AppExperience.toString())];
      eaf =
        eaf *
        SoftwareEngineerCapability[
          scale.indexOf(updated.SoftwareCapability.toString())
        ];
      eaf =
        eaf *
        VirtualMachineExperience[
          scale.indexOf(updated.vmexperience.toString())
        ];
      eaf =
        eaf *
        ProgrammingExperience[
          scale.indexOf(updated.ProgrammingExperience.toString())
        ];

      eaf =
        eaf * SoftwareEngineeringMethods[scale.indexOf(updated.sem.toString())];
      eaf = eaf * UseofSoftwareTools[scale.indexOf(updated.ust.toString())];
      eaf =
        eaf *
        DevelopmentTime[scale.indexOf(updated.DevelopmentTime.toString())];

      var effort = (a * Math.pow(req.query.kloc, b) * eaf).toFixed(2);
      var scheduledTime = (c * Math.pow(effort, d)).toFixed(2);
      var results = {
        effortE: effort,
        scheduledTimeD: scheduledTime,
      };

      res.render("CostEstimationoutput", results);
    } catch (error) {
      console.log(error);
    }
}

module.exports = calculatecost;