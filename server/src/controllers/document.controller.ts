import { NextFunction, Request, Response } from "express";
import { getDb } from "../config/database";
import { EmployeeRepository } from "../repositories/employee.repository";
import { generateAppointmentLetterDocx } from "../services/appointmentLetter.service";
import { AppError } from "../middleware/errorHandler";

export async function downloadAppointmentLetter(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = Number(req.params.employeeId);
    const db = getDb();
    const employee = new EmployeeRepository(db).findById(employeeId);
    if (!employee) throw new AppError(404, "Employee not found");

    const buffer = await generateAppointmentLetterDocx(employeeId, db);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Appointment_Letter_${employee.employee_code}.docx"`
    );
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}
