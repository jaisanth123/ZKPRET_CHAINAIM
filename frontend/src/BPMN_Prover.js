import React, { useState } from 'react';
import './BPMN_Prover.css';

const BPMN = () => {
    const [expectedFile, setExpectedFile] = useState(null);
    const [actualFile, setActualFile] = useState(null);
    const [booleanResult, setBooleanResult] = useState(null);

    const handleFileChange = (e, type) => {
        if (e.target.files) {
            if (type === 'expected') setExpectedFile(e.target.files[0]);
            if (type === 'actual') setActualFile(e.target.files[0]);
        }
    };

    const handleProcessFiles = async () => {
        if (expectedFile && actualFile) {
            try {
                const expectedFormData = new FormData();
                expectedFormData.append('bpmnFile', expectedFile);

                await fetch('http://localhost:4000/api/upload/expected', {
                    method: 'POST',
                    body: expectedFormData,
                });

                const actualFormData = new FormData();
                actualFormData.append('bpmnFile', actualFile);

                await fetch('http://localhost:4000/api/upload/actual', {
                    method: 'POST',
                    body: actualFormData,
                });

                const resultResponse = await fetch('http://localhost:4000/api/verify-bpmn');
                const resultData = await resultResponse.json();
                setBooleanResult(resultData.isVerified);
            } catch (error) {
                console.error('Error processing files:', error);
                alert('An error occurred while processing the files.');
            }
        } else {
            alert('Please upload both files to proceed.');
        }
    };

    return (
        <div className="bpmn">
            <div>
                <h1>BPMN Process Prover</h1>
                <h3>Upload your BPMN Process representations</h3>
            </div>
            <form className="form">
                <div>
                    <label>Expected Sequence</label>
                    <input
                        type="file"
                        onChange={(e) => handleFileChange(e, 'expected')}
                    />
                </div>
                <div>
                    <label>Actual Sequence</label>
                    <input
                        type="file"
                        onChange={(e) => handleFileChange(e, 'actual')}
                    />
                </div>
                {expectedFile && actualFile && (
                    <button
                        type="button"
                        onClick={handleProcessFiles}
                    >
                        Process Both Files
                    </button>
                )}
                <div>
                    <h3>Verification Result:</h3>
                    <pre>{booleanResult !== null ? booleanResult.toString() : 'No result yet'}</pre>
                </div>
            </form>
        </div>
    );
};

export default BPMN;
