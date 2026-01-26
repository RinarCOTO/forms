
const Land = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold text-center uppercase">Real Property Field Appraisal & Assessment Sheet 
                <br />
                building & other structures
            </h1>
            <h2 className="text-right pr-4">
                Transaction Code _____
            </h2>
            <div className="p-4">
                <table className="w-full table-fixed border-collapse border-2 p-4">
                    <tbody className="p-4">
                        <tr>
                            <td className="bordered-table w-1/2">ARP No</td>
                            <td className="bordered-table w-1/2">PIN</td>
                        </tr>
                        <tr>
                            <td className="bordered-table w-1/2">
                                <div className="grid grid-cols-2">
                                    <div>
                                        OCT/TCT/CLOA No.
                                    </div>
                                    <div>
                                        Dated:
                                    </div>
                                </div>
                            </td>
                            <td className="bordered-table w-1/2">
                                <div className="grid grid-cols-3">
                                    <div>
                                        Survey No.
                                    </div>
                                    <div>
                                        Lot No.
                                    </div>
                                    <div>
                                        Blk:
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="bordered-table align-top w-1/2">
                                <div className="flex flex-col">
                                    <div> Owner: </div>
                                    <div> Address: </div>
                                    <div> Tel No: </div>
                                </div>
                            </td>
                            <td className="bordered-table align-bottom w-1/2">
                                <div>TIN:</div>
                            </td>
                        </tr>
                        <tr>
                            <td className="bordered-table align-top w-1/2">
                                <div className="flex flex-col">
                                    <div> Adminisrator/Beneficial User: </div>
                                    <div> Address: </div>
                                    <div> Tel No: </div>
                                </div>
                            </td>
                            <td className="bordered-table align-bottom w-1/2">
                                <div>TIN:</div>
                            </td>
                        </tr>
                        <tr>
                            
                        </tr>
                    </tbody>
                </table>
                <table className="w-full table-fixed border-collapse  mt-4">
                    <thead>
                        <tr>
                            <th className="uppercase text-left">building location</th>
                            <th className="uppercase text-left">land reference</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="bordered-table w-1/2">No./Street</td>
                            <td className="bordered-table w-1/2">Owner:</td>
                        </tr>
                        <tr>
                            <td className="bordered-table w-1/2">Brgy. District:</td>
                            <td className="bordered-table w-1/2">
                                <div className="grid grid-cols-2">
                                    <div >OCT/TCT/CLOA No.</div>
                                    <div >Survey No.</div>
                                    <div >Lot No.</div>
                                    <div >Lot Blk No.</div>
                                </div>
                            </td>
                        </tr>
                        <tr className="bordered-table">
                            <td className="bordered-table w-1/2">Municipality:</td>
                            <td className="bordered-table w-1/2">TD/ARP No.</td>
                        </tr>
                        <tr>
                            <td className="bordered-table w-1/2">Province/City:</td>
                            <td className="bordered-table w-1/2">Area:</td>
                        </tr>
                    </tbody>
                </table>
                <table className="w-full table-fixed border-collapse  mt-4">
                    <thead>
                        <tr>
                            <th className="uppercase text-left">General Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="bordered-table w-1/2">Kind of Bldg:</td>
                            <td className="bordered-table w-1/2">Bldg. Age:</td>
                        </tr>
                        <tr>
                            <td className="bordered-table w-1/2">Structural Type:</td>
                            <td className="bordered-table w-1/2">No. of Storeys:</td>
                        </tr>
                        <tr>
                            <td className="bordered-table w-1/2">Bldg. Permit No.</td>
                            <td className="bordered-table w-1/2">Area of 1<sup>st</sup> flr:</td>
                        </tr>
                        <tr>
                            <td className="bordered-table w-1/2">Condominium Certificate of Title (CCT)</td>
                            <td className="bordered-table w-1/2">Area of 2<sup>nd</sup> flr:</td>
                        </tr>
                        <tr>
                            <td className="bordered-table w-1/2">Certificate of Completion Issued On:</td>
                            <td className="bordered-table w-1/2">Area of 3<sup>rd</sup> flr:</td>
                        </tr>
                        <tr>
                            <td className="bordered-table w-1/2">Certificate of Occupancy Issued On:</td>
                            <td className="bordered-table w-1/2">Area of 4<sup>th</sup> flr:</td>
                        </tr>
                        <tr>
                            <td className="bordered-table w-1/2">Date Constructed/Completed:</td>
                            <td className="bordered-table w-1/2"></td>
                        </tr>
                        <tr>
                            <td className="bordered-table w-1/2">Date Occupied:</td>
                            <td className="bordered-table w-1/2">Total Floor Area:</td>
                        </tr>
                    </tbody>
                </table>
                <table className="w-full table-fixed border-collapse  mt-4">
                    <th className="uppercase text-left">Floor plan</th>
                    <tbody>
                        <tr>
                            <td className="bordered-table p-4">Attach the building plan or sketch of floor plan. A photography may also be attached if necessary.</td>
                        </tr>
                    </tbody>
                </table>
                <table className="w-full table-fixed border-collapse  mt-4">
                    <th className="uppercase text-left">Structural Materials</th>
                <tbody>
                    <tr>
                        <td className="bordered-table">ROOF</td>
                        <td className="bordered-table">FLOORING</td>
                        <td>
                            <div className="grid grid-cols-4">
                            <div className="bordered-table">1<sup>st</sup><br /> flr:</div>
                            <div className="bordered-table">2<sup>nd</sup> flr:</div>
                            <div className="bordered-table">3<sup>rd</sup> flr:</div>
                            <div className="bordered-table">4<sup>th</sup> flr:</div>
                            </div>
                        </td>
                        <td className="bordered-table">Walls & Partitions</td>
                        <td className="">
                        <div className="grid grid-cols-4">
                            <div className="bordered-table">1<sup>st</sup><br /> flr:</div>
                            <div className="bordered-table">2<sup>nd</sup> flr:</div>
                            <div className="bordered-table">3<sup>rd</sup> flr:</div>
                            <div className="bordered-table">4<sup>th</sup> flr:</div>
                        </div>
                        </td>
                    </tr>
                    <tr>
                        <td className="bordered-table">
                            <div className="grid grid-cols-3">
                            <div className="grid col-span-2">Reinforced Concrete</div>
                            <div className="border">1</div>
                            </div>
                        </td>
                        <td className="bordered-table">Reinforced Concrete <br />(for upper floors)</td>
                        <td></td>
                        <td className="bordered-table">Reinforced Concrete</td>
                        <td></td>
                    </tr>
                    <tr>
                        <td className="bordered-table">
                            <div></div>
                        </td>
                        <td className="bordered-table">Plain Cement</td>
                        <td>
                            <div className="grid grid-cols-4">
                            <div className="bordered-table">1</div>
                            <div className="bordered-table"></div>
                            <div className="bordered-table"></div>
                            <div className="bordered-table"></div>
                            </div>
                        </td>
                        <td className="bordered-table">Plain Cement</td>
                    </tr>
                    <tr>
                        <td>
                            <div className="grid grid-cols-2">
                                <div className="bordered-table">G.I. Sheet</div>
                                <div></div>
                            </div>
                        </td>
                        <td>Marble</td>
                        <td>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                        </td>
                        <td>Plain Cement</td>
                        <td>
                            <div className="grid grid-cols-2">
                                <div></div>
                            </div>
                        </td>
                    </tr>
                    <tr></tr>
                </tbody>
                </table>
            </div>
        </div>
    )
}

export default Land;    