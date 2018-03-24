'use strict';

const encodePostData = data => Object.keys(data).map(field => {

  if (field === 'honeypot') {

    return;

  }

  return encodeURIComponent(field) + "=" + encodeURIComponent(data[field]);


}).join('&');

const decodeUrl = url => atob(atob(url));

const generateData = (elements, fields) => {

  const data = {};

  fields.forEach(item => {

    data[item] = elements[item].value;

    const str = ""; // declare empty string outside of loop to allow it to be appended to for each item in the loop

    if (elements[item].type === "checkbox") { // special case for Edge's html collection

      str = str + elements[item].checked + ", "; // take the string and append the current checked value to the end of it, along with a comma and a space

      data[item] = str.slice(0, -2); // remove the last comma and space from the  string to make the output prettier in the spreadsheet

    } else if (elements[item].length) {

      for (const i = 0; i < elements[item].length; i++) {

        if (elements[item].item(i).checked) {

          str = str + elements[item].item(i).value + ", "; // same as above

          data[item] = str.slice(0, -2);

        }

      }

    }

  });

  return data;

};

const getFields = elements => Object.keys(elements).map(item => {

  if (elements[item].name !== undefined) {

    return elements[item].name;
    // special case for Edge's html collection

  } else if (elements[item].length > 0) {

    return elements[item].item(0).name;

  }

}).filter((item, pos, self) => {

  return self.indexOf(item) == pos && item;

});

// get all data in form and return object
const getFormData = form => {

  const elements = form.elements; // all form elements

  const fields = getFields(elements);

  const data = generateData(elements, fields);

  // add form-specific values into the data
  data.formDataNameOrder = JSON.stringify(fields);

  return data;

};

const isHuman = honeypot => honeypot ? false : true;

const sendPost = (url, encoded, cb = () => {}) => {

  const decodedUrl = decodeUrl(url);

  const xhr = new XMLHttpRequest();

  xhr.open('POST', decodedUrl);
  // xhr.withCredentials = true;
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

  xhr.onreadystatechange = function () {

    if (this.readyState == 4 && this.status == 200) {

      return cb(xhr);

    }

  };

  xhr.send(encoded);
};

const handleFormSubmit = (...[form, url, honeypot, cb]) => event => {

  event.preventDefault();

  const data = getFormData(form); // get the values submitted in the form

  if (!isHuman(data[honeypot])) { //if honeypot is filled, form will not be submitted

    return;

  }

  // url encode form data for sending as post data
  const encoded = encodePostData(data);

  sendPost(url, encoded, cb);
};

const initMailForm = (formSelector, ...args) => {

  const contactForm = document.querySelector(formSelector);

  contactForm.addEventListener(
    "submit",
    handleFormSubmit(contactForm, ...args),
    false
  );

};