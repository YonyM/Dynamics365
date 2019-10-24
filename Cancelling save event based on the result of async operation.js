var AccountForm = (function () {
 
    var SaveMode = {
        Save: 1,
        SaveAndClose: 2,
        SaveAndNew: 59,
        Autosave: 70
    };
 
    //this is variable that shows if validation was successfully passed or not
    var isValidationNeeded = true;
    
    function OnSave(executionContext) {
        //so if there are several save handlers and one of previous already called preventDefault
        //there is no need to do any validations anymore
        if (executionContext.getEventArgs().isDefaultPrevented()) {
            return;
        }
 
        //getting save mode from event
        var saveMode = executionContext.getEventArgs().getSaveMode();
 
        //if savemode is not one of listed - just quit the execution and let the record to be saved
        if (saveMode !== SaveMode.Save &&
            saveMode !== SaveMode.SaveAndClose &&
            saveMode !== SaveMode.SaveAndNew &&
            saveMode !== SaveMode.Autosave) {
            return;
        }
 
        //so if validation was successfully passed - flag is reset
        //and code just leaves the form alone and allows changes to be saved
        if (!isValidationNeeded) {
            isValidationNeeded = true;
            return;
        }
 
        //getting of the form context from execution context object
        var formContext = executionContext.getFormContext();
 
        //getting of "Account Number" value from field
        var accountNumber = formContext.getAttribute("accountnumber").getValue();
 
        //if field is blank there is no need to do any checks - code just leaves form
        if (accountNumber == null) {
            return;
        }
 
        //preventing of the save operation before async operation is started
        executionContext.getEventArgs().preventDefault();
 
        //initial composing of query - account number is equal to value from form
        var query = "$select=accountid&$filter=accountnumber eq '" + accountNumber + "'";
 
        //if form is "Update"
        if (formContext.ui.getFormType() === 2) {
            //then current record should be ignored
            query += " and  accountid ne '" + formContext.data.entity.getId() + "'";
        }
 
        Xrm.WebApi.retrieveMultipleRecords("account", query).then(
            function success(results) {
                //so if there are other records with the same account number
                if (results.entities.length !== 0) {
                    //this message is shown to user only when user caused save, autosave is just blocked
                    if (saveMode !== SaveMode.Autosave) {
                        Xrm.Navigation.openAlertDialog({
                            text: "Account with this Account Number already exists"
                        });
                    }
                } else {
                    //othervice validation flag is set to "Passed"
                    isValidationNeeded = false;
                    //and save event is called again
                    if (saveMode === SaveMode.Save ||
                        saveMode === SaveMode.Autosave) {
                        formContext.data.entity.save();
                    } else if (saveMode === SaveMode.SaveAndClose) {
                        formContext.data.entity.save("saveandclose");
                    } else {
                        formContext.data.entity.save("saveandnew");
                    }
                }
            },
            function (error) {
                //if something went wrong - error message is shown to user
                Xrm.Navigation.openAlertDialog({ text: error.message });
            }
        );
    }
    
    return {
        OnSave: OnSave
    };
})();
