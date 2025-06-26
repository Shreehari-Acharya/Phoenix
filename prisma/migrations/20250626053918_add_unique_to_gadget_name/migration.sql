/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `gadget` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "gadget_name_key" ON "gadget"("name");
