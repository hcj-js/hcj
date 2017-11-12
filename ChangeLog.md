# Changes in Latest #

* Renamed hcj.forms.formType to hcj.forms.fieldType.
* Changed hcj.forms.formFor's first parameter.  It is now a function
  returning the form type used for the submit button, whereas
  previously it was an object with a single `button` property whose
  value was a function returning the form type used for the submit
  button.  Additionally, it has been renamed from confusing "formType"
  to sensical "submitButtonFieldTypeF".
* Changed hcj.forms.formFor's style parameter.  It is now an object
  with a property for each field kind - instead of a function whose
  first parameter is a field kind.
* Form styles now take title as first argument rather than last
  argument; all other arguments have been shifted down.
* Changed hcj.forms.formFor's constructor parameter.  Reordered its
  arguments.  Streams used to be the first parameter; now it is the
  third.
