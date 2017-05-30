/**********************************
*     E-Commerce Search v2.0      *
* Author : sam.conran@tealium.com *
**********************************/


window.ecom_searchHandler = function (a) {
  if (!window.ecom_search[a]) {
    tTools.sendError('No such function!');
    return false;
  }
  window.ecom_search[a]();
}

window.ecom_search = window.ecom_search || {};

window.ecom_search.reset = function () {
  tTools.send({
    reset : true
  })
}

window.ecom_search.print_hi = function () {
  console.log('hi');
}

window.ecom_search.template_check = function (){

    if (!window.utui) {
      tTools.sendError('No UTUI!','In order to use this tool, you have to be inside the TiQ interface, logged into the desired profile.');
      return false;
    }

    const ends = [')', '=', ' ', ';', ']', '}', '\']', '"]', '.', ',', '[', '!'],
          b_ = 'b._c';

    // function httpGet(url, output, index, num, total) {
        // var xmlHttp = new XMLHttpRequest();
        // xmlHttp.addEventListener('load', function(){
        //   num++;
        //   console.log('Loaded template for tag '+index);
        //   output[index] = xmlHttp.responseText;
        //   if (num===total) send_results();
        // })
        // xmlHttp.open( "GET", url); // false for synchronous request
        // xmlHttp.send( null );
    // }

    var results_tags = [],
        results_vars = [],
        utk = utui.util.getUTK(),
        account = utui.profile.lastAccount,
        profile = utui.profile.lastProfile,
        revision = utui.profile.lastRevision,
        key_id = account+'.'+profile;

    //window.ecom_search.data = (localStorage['ecom_search.data']) ? JSON.parse(localStorage['ecom_search.data']) : window.ecom_search.data || {};
    window.ecom_search.data = window.ecom_search.data || {};
    window.ecom_search.data[key_id] = window.ecom_search.data[key_id] || {};
    window.ecom_search.data[key_id].templates = window.ecom_search.data[key_id].templates || {};
    let templates = window.ecom_search.data[key_id].templates;

    if (!Object.keys(templates).length){
        let num = 0,
            total = Object.keys(utui.data.manage).length,
            large = false;

          if (total > 100) large = true;

        tTools.send({
          loading: {
            account,
            profile,
            total,
            large
          }
        })
        console.log('Performing first time templates load...')
        for (let i in utui.data.manage) {
            let url = ('https://my.tealiumiq.com/urest/legacy/getTemplate?utk='+utk+'&account='+account+'&profile='+profile+'&revision='+revision+'&template=profile.'+i+'&cb='+Math.random()+'&_='+Date.now());
            let xmlHttp = new XMLHttpRequest();
            xmlHttp.addEventListener('load', function(){
              num++;
              console.log('Loaded template for tag '+i);
              templates[i] = xmlHttp.responseText;
              if (num===total) send_results();
            })
            xmlHttp.open( "GET", url); // false for synchronous request
            xmlHttp.send( null );
            //httpGet(url, templates, i, num, total);
        }
    } else {
      send_results();
    }

    function send_results() {
      for (let uid in templates) {
          let variables = [],
              j = templates[uid],
              b_index = j.indexOf(b_);

          while (b_index > -1){
              let sub_string = j.substring(b_index + 2),
                  inds = [];

              for (let i of ends) {
                  let pos = sub_string.indexOf(i);
                  if (pos > -1) inds.push(pos);
              }

              let end = Math.min.apply(Math, inds),
                  result = sub_string.substring(0, end);

              if (variables.indexOf(result) == -1) variables.push(result);
              j = sub_string;
              b_index = j.indexOf(b_);
          }

          let tag_name = utui.data.manage[uid].title,
              tag_type = utui.data.manage[uid].tag_name,
              tag_name_reduction = (tag_name.length <= 35) ? tag_name : tag_name.substring(0,35) + '...';

          if(variables.length > 0) {
            results_tags.push({uid, tag_name:tag_name_reduction, tag_type, variables});

            for (let i in variables) {
              let variable = variables[i],
                  exists = false,
                  index;

              exists = results_vars.some(function (e, i) {
                let r = (e.variable === variable);
                if (r) {
                  index = i;
                }
                return r;
              });

              if (!exists) {

                let tags = [{uid, tag_name, tag_type}];

                results_vars.push({
                  variable,
                  tags
                })
              } else {
                results_vars[index].tags.push({uid, tag_name, tag_type});
              }
            }
          }
      }

      window.ecom_search.data[key_id].results_tags = results_tags;
      console.log(ecom_search.data[key_id].results_tags);
      window.ecom_search.data[key_id].results_vars = results_vars;
      console.log(ecom_search.data[key_id].results_vars);
      //array

      tTools.send({
        results: {
          account,
          profile,
          tags : results_tags,
          vars : results_vars
        }
      })
    }
    //localStorage.setItem('ecom_search.data',(JSON.stringify(window.ecom_search.data)))
}

window.ecom_search.reset();
